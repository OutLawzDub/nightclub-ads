import { NextResponse } from 'next/server';
import { ensureDatabaseConnection } from '../database-wrapper.js';
import { getUserByIds } from '../../../services/user.service.js';
import { sendBulkSmsViaBrevo } from '../../../services/brevo-sms.service.js';

export async function POST(req) {
  try {
    await ensureDatabaseConnection();

    const formData = await req.formData();
    const messageType = formData.get('messageType') || 'whatsapp';
    const template = formData.get('template');
    const text = formData.get('text');
    const userIdsJson = formData.get('userIds');
    const imageFile = formData.get('image');

    if (!text || !userIdsJson) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    if (messageType === 'whatsapp' && !template) {
      return NextResponse.json(
        { error: 'Template requis pour WhatsApp' },
        { status: 400 }
      );
    }

    const userIds = JSON.parse(userIdsJson);

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Aucun utilisateur sélectionné' },
        { status: 400 }
      );
    }

    const users = await getUserByIds(userIds);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Aucun utilisateur trouvé' },
        { status: 404 }
      );
    }

    console.log(`Utilisateurs récupérés: ${users.length}`);
    console.log(`Exemple d'utilisateur:`, {
      id: users[0]?.id,
      phoneNumber: users[0]?.phoneNumber,
      email: users[0]?.email,
      firstName: users[0]?.firstName,
      lastName: users[0]?.lastName,
    });

    const usersForSms = users.map(user => ({
      id: user.id,
      phoneNumber: user.phoneNumber || user.phone_number,
      email: user.email || '',
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
    }));

    console.log(`Utilisateurs formatés pour SMS:`, usersForSms.slice(0, 2));

    let imageBuffer = null;
    let imageMimeType = null;

    if (messageType === 'whatsapp' && imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'L\'image ne doit pas dépasser 5 Mo' },
          { status: 400 }
        );
      }

      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Le fichier doit être une image' },
          { status: 400 }
        );
      }

      imageBuffer = await imageFile.arrayBuffer();
      imageMimeType = imageFile.type;
      console.log(`Image reçue: ${imageFile.name} (${imageFile.size} bytes, ${imageMimeType})`);
    }

    console.log(`Envoi d'annonce par ${messageType.toUpperCase()} à ${users.length} utilisateur(s)`);
    
    if (messageType === 'sms') {
      try {
        const campaignName = `Campagne SMS ${new Date().toISOString().split('T')[0]}`;
        const brevoResult = await sendBulkSmsViaBrevo(usersForSms, text, campaignName);
        
        return NextResponse.json({
          message: `Campagne SMS créée et envoyée ! ${brevoResult.contactsAdded} contact(s) ajouté(s)${brevoResult.contactsFailed > 0 ? `, ${brevoResult.contactsFailed} échec(s)` : ''}`,
          sent: brevoResult.contactsAdded,
          failed: brevoResult.contactsFailed,
          total: users.length,
          messageType: 'sms',
          folderId: brevoResult.folderId,
          campaignId: brevoResult.campaignId,
          listId: brevoResult.listId,
          credits: {
            before: brevoResult.creditsBefore,
            used: brevoResult.creditsUsed,
            remaining: brevoResult.creditsRemaining,
          },
          details: {
            contactsErrors: brevoResult.contactsErrors,
          },
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi des SMS via Brevo:', error);
        
        const errorMessage = error.message || '';
        const isInsufficientCredits = errorMessage.includes('Crédits SMS insuffisants') || errorMessage.includes('crédit');
        
        if (isInsufficientCredits) {
          return NextResponse.json(
            { 
              error: errorMessage,
              messageType: 'sms',
            },
            { status: 400 }
          );
        }
        
        const errorResponse = error.response || {};
        const errorBody = errorResponse.body || errorResponse.data || {};
        const apiErrorMessage = errorBody.message || errorBody.error || errorMessage;
        const errorCode = errorBody.code || errorResponse.status;
        
        console.error('Error.response complet:', JSON.stringify({
          status: errorResponse.status,
          statusText: errorResponse.statusText,
          headers: errorResponse.headers,
          data: errorResponse.data,
          body: errorResponse.body,
        }, null, 2));
        
        return NextResponse.json(
          { 
            error: `Erreur lors de l'envoi des SMS: ${apiErrorMessage}`,
            messageType: 'sms',
            details: {
              message: apiErrorMessage,
              code: errorCode,
              status: errorResponse.status,
              statusText: errorResponse.statusText,
              body: errorBody,
              response: {
                status: errorResponse.status,
                statusText: errorResponse.statusText,
                headers: errorResponse.headers,
                data: errorResponse.data,
                body: errorResponse.body,
              },
              errors: error.errors || [],
              stack: error.stack,
              fullError: error.toString(),
            },
          },
          { status: errorResponse.status || 500 }
        );
      }
    }
    
    if (messageType === 'whatsapp') {
      console.log(`Template: ${template}`);
      console.log(`Message: ${text}`);
      if (imageBuffer) {
        console.log(`Image attachée: ${imageFile.name}`);
      }

      for (const user of users) {
        console.log(`Envoi WhatsApp à ${user.phoneNumber} - ${user.firstName} ${user.lastName}`);
      }

      return NextResponse.json({
        message: `Annonce WhatsApp envoyée à ${users.length} utilisateur(s) avec succès ! L'intégration WhatsApp sera implémentée ici.`,
        sent: users.length,
        messageType: 'whatsapp',
        template: template,
        hasImage: !!imageBuffer,
      });
    }
  } catch (error) {
    console.error('Error sending annonce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'annonce' },
      { status: 500 }
    );
  }
}
