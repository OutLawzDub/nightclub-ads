import { 
  TransactionalSMSApi, 
  SendTransacSms, 
  TransactionalSMSApiApiKeys,
  SMSCampaignsApi,
  CreateSmsCampaign,
  SMSCampaignsApiApiKeys,
  ContactsApi,
  CreateContact,
  CreateList,
  CreateUpdateFolder,
  AddContactToList,
  ContactsApiApiKeys,
  AccountApi,
  AccountApiApiKeys
} from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

const normalizePhoneForBrevo = (phoneNumber) => {
  if (!phoneNumber) {
    return null;
  }
  
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/\.|-|_|\(|\)/g, '');
  
  if (cleaned.startsWith('+33')) {
    return cleaned;
  } else if (cleaned.startsWith('0033')) {
    return '+33' + cleaned.substring(4);
  } else if (cleaned.startsWith('33') && cleaned.length === 11) {
    return '+33' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    return '+33' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    return '+33' + cleaned;
  }
  
  return cleaned;
};

export const getSmsCredits = async () => {
  try {
    const { accountApi } = initializeApis();
    const account = await accountApi.getAccount();
    
    const smsPlan = account.body.plan?.find(p => p.type === 'sms');
    const credits = smsPlan?.credits || 0;
    
    return {
      credits: credits,
      planType: smsPlan?.type || 'unknown',
      creditsType: smsPlan?.creditsType || 'unknown',
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des crédits:', error.response?.body || error.message);
    throw error;
  }
};

const initializeApis = () => {
  const apiKey = process.env.BREVO_API;
  
  if (!apiKey) {
    console.error('Variables d\'environnement disponibles:', Object.keys(process.env).filter(k => k.includes('BREVO') || k.includes('API')));
    throw new Error('BREVO_API n\'est pas configuré dans le fichier .env. Vérifiez que la variable existe et redémarrez le serveur Next.js.');
  }

  const transactionalSmsApi = new TransactionalSMSApi();
  transactionalSmsApi.setApiKey(TransactionalSMSApiApiKeys.apiKey, apiKey);

  const smsCampaignsApi = new SMSCampaignsApi();
  smsCampaignsApi.setApiKey(SMSCampaignsApiApiKeys.apiKey, apiKey);

  const contactsApi = new ContactsApi();
  contactsApi.setApiKey(ContactsApiApiKeys.apiKey, apiKey);

  const accountApi = new AccountApi();
  accountApi.setApiKey(AccountApiApiKeys.apiKey, apiKey);

  return { transactionalSmsApi, smsCampaignsApi, contactsApi, accountApi };
};

export const createFolder = async (folderName) => {
  try {
    const { contactsApi } = initializeApis();
    
    const createFolderData = new CreateUpdateFolder();
    createFolderData.name = folderName;

    const result = await contactsApi.createFolder(createFolderData);
    console.log(`Dossier créé avec l'ID: ${result.body.id}`);
    return result.body.id;
  } catch (error) {
    const errorMessage = error.response?.body?.message || error.message;
    console.error('Erreur lors de la création du dossier:', errorMessage);
    throw error;
  }
};

export const createContactList = async (listName, folderId) => {
  try {
    const { contactsApi } = initializeApis();
    
    const createList = new CreateList();
    createList.name = listName;
    createList.folderId = folderId;

    const result = await contactsApi.createList(createList);
    console.log(`Liste de contacts créée avec l'ID: ${result.body.id}`);
    return result.body.id;
  } catch (error) {
    console.error('Erreur lors de la création de la liste:', error.response?.body || error.message);
    throw error;
  }
};

const findContactByEmail = async (contactsApi, email) => {
  try {
    const result = await contactsApi.getContactInfo(email);
    return result.body;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

const deleteContactByEmail = async (contactsApi, email) => {
  try {
    await contactsApi.deleteContact(email);
    console.log(`[BREVO] Contact supprimé: ${email}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`[BREVO] Contact déjà supprimé ou inexistant: ${email}`);
      return false;
    }
    console.error(`[BREVO] Erreur lors de la suppression du contact ${email}:`, error.response?.body || error.message);
    return false;
  }
};

const deleteListById = async (contactsApi, listId) => {
  try {
    await contactsApi.deleteList(listId);
    console.log(`[BREVO] Liste supprimée: ${listId}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`[BREVO] Liste déjà supprimée ou inexistante: ${listId}`);
      return false;
    }
    console.error(`[BREVO] Erreur lors de la suppression de la liste ${listId}:`, error.response?.body || error.message);
    return false;
  }
};

const deleteSmsCampaign = async (smsCampaignsApi, campaignId) => {
  try {
    await smsCampaignsApi.deleteSmsCampaign(campaignId);
    console.log(`[BREVO] Campagne SMS supprimée: ${campaignId}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`[BREVO] Campagne déjà supprimée ou inexistante: ${campaignId}`);
      return false;
    }
    console.error(`[BREVO] Erreur lors de la suppression de la campagne ${campaignId}:`);
    console.error(`[BREVO]   Message:`, error.message);
    console.error(`[BREVO]   Status:`, error.response?.status);
    console.error(`[BREVO]   StatusText:`, error.response?.statusText);
    console.error(`[BREVO]   Body complet:`, JSON.stringify(error.response?.body || error.response?.data || {}, null, 2));
    console.error(`[BREVO]   Response complète:`, JSON.stringify({
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      body: error.response?.body,
    }, null, 2));
    return false;
  }
};

const cleanupAllLists = async () => {
  const { contactsApi } = initializeApis();
  try {
    console.log(`[BREVO CLEANUP] Récupération de toutes les listes...`);
    let offset = 0;
    const limit = 50;
    let allLists = [];
    
    while (true) {
      const result = await contactsApi.getLists(limit, offset);
      const lists = result.body?.lists || [];
      if (lists.length === 0) break;
      
      allLists = allLists.concat(lists);
      offset += limit;
      
      if (lists.length < limit) break;
    }
    
    console.log(`[BREVO CLEANUP] ${allLists.length} liste(s) trouvée(s), suppression...`);
    for (const list of allLists) {
      try {
        await deleteListById(contactsApi, list.id);
      } catch (err) {
        console.error(`[BREVO CLEANUP] Erreur suppression liste ${list.id}:`, err.message);
      }
    }
    console.log(`[BREVO CLEANUP] Toutes les listes supprimées`);
  } catch (error) {
    console.error(`[BREVO CLEANUP] Erreur lors de la récupération/suppression des listes:`, error.response?.body || error.message);
  }
};

const cleanupAllSmsCampaigns = async () => {
  const { smsCampaignsApi } = initializeApis();
  try {
    console.log(`[BREVO CLEANUP] Récupération de toutes les campagnes SMS...`);
    let offset = 0;
    const limit = 50;
    let allCampaigns = [];
    
    try {
      const result = await smsCampaignsApi.getSmsCampaigns(undefined, undefined, undefined, limit, offset);
      console.log(`[BREVO CLEANUP] Réponse getSmsCampaigns:`, JSON.stringify(result.body, null, 2));
      const campaigns = result.body?.campaigns || [];
      
      if (campaigns.length > 0) {
        allCampaigns = allCampaigns.concat(campaigns);
      }
      
      console.log(`[BREVO CLEANUP] ${allCampaigns.length} campagne(s) SMS trouvée(s), suppression...`);
      for (const campaign of allCampaigns) {
        try {
          console.log(`[BREVO CLEANUP] Suppression de la campagne ${campaign.id}...`);
          await deleteSmsCampaign(smsCampaignsApi, campaign.id);
        } catch (err) {
          console.error(`[BREVO CLEANUP] Erreur suppression campagne ${campaign.id}:`);
          console.error(`[BREVO CLEANUP]   Message:`, err.message);
          console.error(`[BREVO CLEANUP]   Response:`, JSON.stringify(err.response?.data || err.response?.body || {}, null, 2));
          console.error(`[BREVO CLEANUP]   Status:`, err.response?.status);
        }
      }
      console.log(`[BREVO CLEANUP] Toutes les campagnes SMS supprimées`);
    } catch (getError) {
      console.error(`[BREVO CLEANUP] Erreur lors de la récupération des campagnes SMS:`);
      console.error(`[BREVO CLEANUP]   Message:`, getError.message);
      console.error(`[BREVO CLEANUP]   Response:`, JSON.stringify(getError.response?.data || getError.response?.body || {}, null, 2));
      console.error(`[BREVO CLEANUP]   Status:`, getError.response?.status);
      throw getError;
    }
  } catch (error) {
    console.error(`[BREVO CLEANUP] Erreur globale lors de la suppression des campagnes SMS:`, error.response?.body || error.message);
    console.error(`[BREVO CLEANUP] Error.response complet:`, JSON.stringify({
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      body: error.response?.body,
    }, null, 2));
  }
};

const cleanupContacts = async (users) => {
  const { contactsApi } = initializeApis();
  console.log(`[BREVO CLEANUP] Suppression de ${users.length} contact(s)...`);
  
  for (const user of users) {
    if (user.email && user.email.trim() !== '') {
      await deleteContactByEmail(contactsApi, user.email.trim());
    }
  }
  console.log(`[BREVO CLEANUP] Nettoyage des contacts terminé`);
};

const cleanupAll = async (users) => {
  console.log(`[BREVO CLEANUP] ===== DÉBUT DU NETTOYAGE COMPLET =====`);
  
  await cleanupAllSmsCampaigns();
  await cleanupAllLists();
  await cleanupContacts(users);
  
  console.log(`[BREVO CLEANUP] ===== NETTOYAGE COMPLET TERMINÉ =====`);
};

export const addContactsToList = async (users, listId) => {
  try {
    const { contactsApi } = initializeApis();
    const results = [];
    const errors = [];

    for (const user of users) {
      let normalizedPhone = null;
      let contactId = null;
      
      try {
        normalizedPhone = normalizePhoneForBrevo(user.phoneNumber);
        
        if (!normalizedPhone) {
          errors.push({ 
            user: `${user.firstName} ${user.lastName}`, 
            phone: user.phoneNumber,
            error: 'Numéro de téléphone invalide' 
          });
          continue;
        }

        if (!user.email || user.email.trim() === '') {
          errors.push({ 
            user: `${user.firstName} ${user.lastName}`, 
            phone: user.phoneNumber,
            error: 'Email manquant pour créer le contact Brevo' 
          });
          continue;
        }

        const userEmail = user.email.trim();
        
        console.log(`[BREVO] Recherche du contact existant pour ${userEmail}`);
        let existingContact = await findContactByEmail(contactsApi, userEmail);
        
        if (existingContact) {
          contactId = existingContact.id;
          console.log(`[BREVO] Contact existant trouvé: ID ${contactId}`);
          
          const updateContact = new CreateContact();
          updateContact.attributes = {
            SMS: normalizedPhone,
          };
          
          if (user.firstName && user.firstName.trim() !== '') {
            updateContact.attributes.FIRSTNAME = user.firstName.trim();
          }
          if (user.lastName && user.lastName.trim() !== '') {
            updateContact.attributes.LASTNAME = user.lastName.trim();
          }
          
          updateContact.updateEnabled = true;
          
          console.log(`[BREVO REQUEST] Mise à jour du contact existant`);
          console.log(`[BREVO REQUEST] Payload:`, JSON.stringify({
            attributes: updateContact.attributes,
          }, null, 2));
          
          await contactsApi.updateContact(userEmail, updateContact);
          console.log(`[BREVO RESPONSE] Contact mis à jour avec succès`);
        } else {
          console.log(`[BREVO] Aucun contact existant, création d'un nouveau contact`);
          
          const createContact = new CreateContact();
          createContact.email = userEmail;
          
          createContact.attributes = {
            SMS: normalizedPhone,
          };
          
          if (user.firstName && user.firstName.trim() !== '') {
            createContact.attributes.FIRSTNAME = user.firstName.trim();
          }
          if (user.lastName && user.lastName.trim() !== '') {
            createContact.attributes.LASTNAME = user.lastName.trim();
          }
          
          const contactData = {
            email: createContact.email,
            attributes: createContact.attributes,
          };
          
          console.log(`[BREVO REQUEST] Création du contact pour ${user.firstName} ${user.lastName}`);
          console.log(`[BREVO REQUEST] Email: ${createContact.email}`);
          console.log(`[BREVO REQUEST] Téléphone: ${normalizedPhone}`);
          console.log(`[BREVO REQUEST] Payload complet:`, JSON.stringify(contactData, null, 2));
          
          const result = await contactsApi.createContact(createContact);
          
          console.log(`[BREVO RESPONSE] Contact créé avec succès`);
          console.log(`[BREVO RESPONSE] Status: ${result.response?.status || 'N/A'}`);
          console.log(`[BREVO RESPONSE] Body:`, JSON.stringify(result.body, null, 2));
          contactId = result.body.id;
          console.log(`Contact créé avec succès: ID ${contactId}`);
        }
        
        console.log(`[BREVO REQUEST] Ajout du contact à la liste ${listId}`);
        const addContactToList = new AddContactToList();
        addContactToList.emails = [userEmail];
        
        const addToListResult = await contactsApi.addContactToList(listId, addContactToList);
        console.log(`[BREVO RESPONSE] Contact ajouté à la liste`);
        console.log(`[BREVO RESPONSE] Status: ${addToListResult.response?.status || 'N/A'}`);
        console.log(`[BREVO RESPONSE] Body:`, JSON.stringify(addToListResult.body, null, 2));
        
        results.push({
          userId: user.id,
          phone: normalizedPhone,
          contactId: contactId,
          existing: !!existingContact,
        });
      } catch (error) {
        const errorResponse = error.response || {};
        const errorBody = errorResponse.body || {};
        const errorMessage = errorBody.message || errorBody.error || error.message;
        const errorCode = errorBody.code || errorResponse.status;
        
        console.error(`[BREVO ERROR] Erreur pour ${user.firstName} ${user.lastName} (${user.phoneNumber}):`);
        console.error(`[BREVO ERROR] Status: ${errorResponse.status} ${errorResponse.statusText}`);
        console.error(`[BREVO ERROR] Message: ${errorMessage}`);
        console.error(`[BREVO ERROR] Code: ${errorCode}`);
        console.error(`[BREVO ERROR] Body complet:`, JSON.stringify(errorBody, null, 2));
        console.error(`[BREVO ERROR] Error.response complet:`, JSON.stringify({
          status: errorResponse.status,
          statusText: errorResponse.statusText,
          headers: errorResponse.headers,
          data: errorResponse.data,
          body: errorResponse.body,
        }, null, 2));
        console.error(`[BREVO ERROR] Error complet:`, error);
        
        errors.push({ 
          user: `${user.firstName} ${user.lastName}`, 
          phone: user.phoneNumber,
          normalizedPhone: normalizedPhone,
          error: errorMessage || `Erreur ${errorResponse.status}: ${JSON.stringify(errorBody)}`,
          code: errorCode,
          details: {
            body: errorBody,
            response: {
              status: errorResponse.status,
              statusText: errorResponse.statusText,
              headers: errorResponse.headers,
              data: errorResponse.data,
            },
          },
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  } catch (error) {
    console.error('Erreur lors de l\'ajout des contacts:', error.response?.body || error.message);
    throw error;
  }
};

export const createAndSendSmsCampaign = async (campaignName, message, listId, sender = 'Nightclub') => {
  try {
    const { smsCampaignsApi } = initializeApis();
    
    const campaign = new CreateSmsCampaign();
    campaign.name = campaignName;
    campaign.sender = sender;
    campaign.content = message;
    campaign.recipients = { listIds: [listId] };
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2);
    campaign.scheduledAt = now.toISOString();
    campaign.unicodeEnabled = true;

    const result = await smsCampaignsApi.createSmsCampaign(campaign);
    console.log(`Campagne SMS créée avec l'ID: ${result.body.id}`);
    return {
      success: true,
      campaignId: result.body.id,
    };
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error.response?.body || error.message);
    throw error;
  }
};

export const sendBulkSmsViaBrevo = async (users, message, campaignName = null) => {
  try {
    const requiredCredits = users.length;
    
    await cleanupAll(users);
    
    console.log(`Vérification des crédits SMS disponibles...`);
    const creditsInfo = await getSmsCredits();
    console.log(`Crédits SMS disponibles: ${creditsInfo.credits}, Requis: ${requiredCredits}`);
    
    if (creditsInfo.credits < requiredCredits) {
      const missingCredits = requiredCredits - creditsInfo.credits;
      throw new Error(`Crédits SMS insuffisants. Vous avez ${creditsInfo.credits} crédit(s) disponible(s) mais ${requiredCredits} SMS doivent être envoyés (1 crédit = 1 SMS). Il manque ${missingCredits} crédit(s). Veuillez recharger vos crédits SMS sur votre compte Brevo avant de continuer.`);
    }
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', ' ').substring(0, 19);
    const uniqueId = Math.random().toString(36).substring(2, 9);
    
    const folderName = `Campagne SMS ${timestamp} ${uniqueId}`;
    const listName = `Liste ${timestamp} ${uniqueId}`;
    const campaignNameFinal = campaignName || `Campagne ${timestamp} ${uniqueId}`;
    
    console.log(`Création du dossier: ${folderName}`);
    const folderId = await createFolder(folderName);
    
    console.log(`Création de la liste de contacts: ${listName}`);
    const listId = await createContactList(listName, folderId);
    
    console.log(`Ajout de ${users.length} contacts à la liste...`);
    const contactsResult = await addContactsToList(users, listId);
    
    console.log(`Contacts ajoutés: ${contactsResult.success}, Échecs: ${contactsResult.failed}`);
    
    if (contactsResult.success === 0) {
      const errorDetails = contactsResult.errors.map(e => 
        `${e.user} (${e.phone}): ${e.error}`
      ).join('; ');
      const error = new Error(`Aucun contact n'a pu être ajouté à la liste. Erreurs: ${errorDetails}`);
      error.errors = contactsResult.errors;
      throw error;
    }
    
    console.log(`Création et envoi de la campagne SMS: ${campaignNameFinal}`);
    const campaignResult = await createAndSendSmsCampaign(campaignNameFinal, message, listId);
    
    return {
      success: true,
      folderId,
      listId,
      campaignId: campaignResult.campaignId,
      contactsAdded: contactsResult.success,
      contactsFailed: contactsResult.failed,
      contactsErrors: contactsResult.errors,
      creditsBefore: creditsInfo.credits,
      creditsUsed: requiredCredits,
      creditsRemaining: creditsInfo.credits - requiredCredits,
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi des SMS via Brevo:', error);
    throw error;
  }
};

