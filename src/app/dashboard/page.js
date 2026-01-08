'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [paginatedUsers, setPaginatedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnnonceModal, setShowAnnonceModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('tous'); // 'tous', 'majeur', 'mineur'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1);
  }, [users, searchTerm, ageFilter]);

  useEffect(() => {
    calculatePagination();
  }, [filteredUsers, currentPage]);

  const isAdult = (birthDate) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return (age - 1) >= 18;
    }
    return age >= 18;
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.phoneNumber?.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ageFilter === 'majeur') {
      filtered = filtered.filter(user => isAdult(user.birthDate));
    } else if (ageFilter === 'mineur') {
      filtered = filtered.filter(user => user.birthDate && !isAdult(user.birthDate));
    }

    setFilteredUsers(filtered);
  };

  const calculatePagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredUsers.slice(startIndex, endIndex);
    setPaginatedUsers(paginated);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Échec de la suppression de l\'utilisateur');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleLogout = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate__animated animate__fadeIn">
          <div className="text-2xl text-white animate__animated animate__pulse">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 animate__animated animate__fadeIn">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate__animated animate__fadeInDown">
                Gestion des utilisateurs
              </h1>
              <p className="text-sm text-gray-400 mt-2 animate__animated animate__fadeInUp">
                📍 Étape 1 sur 2 : Configurez votre annonce en sélectionnant les utilisateurs cibles
              </p>
            </div>
            <div className="flex gap-4">
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setShowAnnonceModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 hover:scale-105 active:scale-95 animate__animated animate__pulse"
                >
                  📢 Faire mon annonce ({selectedUsers.length})
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-105 active:scale-95 animate__animated animate__pulse"
              >
                + Ajouter un utilisateur
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-6 animate__animated animate__fadeInUp">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              >
                <option value="tous">Tous les âges</option>
                <option value="majeur">Majeurs uniquement</option>
                <option value="mineur">Mineurs uniquement</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {filteredUsers.length} utilisateur(s) trouvé(s) • {selectedUsers.length} sélectionné(s)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUsers(filteredUsers.map(u => u.id))}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 text-sm font-medium"
              >
                ✓ Tout sélectionner
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 text-sm font-medium"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 animate__animated animate__fadeInUp">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-16">
                    Sélection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Code postal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date de naissance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-700 transition-colors duration-200 animate__animated animate__fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <label className="flex items-center justify-center cursor-pointer group">
                        <div className={`
                          w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center
                          ${selectedUsers.includes(user.id) 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent shadow-lg shadow-purple-500/50' 
                            : 'bg-gray-700 border-gray-600 group-hover:border-purple-500 group-hover:bg-gray-600'
                          }
                        `}>
                          {selectedUsers.includes(user.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="sr-only"
                        />
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {user.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.postalCode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.birthDate || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.birthDate ? (
                        isAdult(user.birthDate) ? (
                          <span className="px-2 py-1 bg-green-900 text-green-200 rounded-lg text-xs font-medium">Majeur</span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-900 text-orange-200 rounded-lg text-xs font-medium">Mineur</span>
                        )
                      ) : (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-lg text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-purple-400 hover:text-purple-300 mr-4 transition-colors duration-200 transform hover:scale-110"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200 transform hover:scale-110"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {currentPage} sur {totalPages} ({filteredUsers.length} utilisateur(s) au total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Précédent
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="text-gray-400">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className="fixed bottom-8 right-8 z-40 animate__animated animate__fadeInUp">
          <button
            onClick={() => setShowAnnonceModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-full shadow-2xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 font-medium text-lg animate__animated animate__pulse"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Faire mon annonce ({selectedUsers.length})</span>
          </button>
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      {showEditModal && editingUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      {showAnnonceModal && (
        <AnnonceModal
          isOpen={showAnnonceModal}
          onClose={() => setShowAnnonceModal(false)}
          selectedUserIds={selectedUsers}
        />
      )}
    </div>
  );
}

function AnnonceModal({ isOpen, onClose, selectedUserIds }) {
  const [messageType, setMessageType] = useState('sms');
  const whatsappMaintenance = true;
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customText, setCustomText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [smsCredits, setSmsCredits] = useState(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  const templates = [
    {
      id: 'template1',
      name: 'Template Événement',
      defaultText: 'Ne manquez pas notre événement exceptionnel ! 🎉',
      description: 'Template générique pour événements',
    },
    {
      id: 'template2',
      name: 'Template Promotion',
      defaultText: '🎁 Promotion spéciale pour vous !',
      description: 'Template pour offres et promotions',
    },
    {
      id: 'template3',
      name: 'Template Rappel',
      defaultText: '📅 Rappel : votre événement approche !',
      description: 'Template de rappel pour événements',
    },
  ];

  useEffect(() => {
    if (selectedTemplate && messageType === 'whatsapp') {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setCustomText(template.defaultText);
        setImageFile(null);
        setImagePreview(null);
      }
    }
  }, [selectedTemplate, messageType]);

  useEffect(() => {
    setCharCount(customText.length);
  }, [customText]);

  useEffect(() => {
    if (whatsappMaintenance && messageType === 'whatsapp') {
      setMessageType('sms');
    }
  }, [whatsappMaintenance]);

  useEffect(() => {
    if (messageType === 'sms') {
      setSelectedTemplate('');
      setImageFile(null);
      setImagePreview(null);
      fetchSmsCredits();
    }
  }, [messageType]);

  useEffect(() => {
    if (isOpen && messageType === 'sms') {
      fetchSmsCredits();
    }
  }, [isOpen, messageType]);

  const fetchSmsCredits = async () => {
    setIsLoadingCredits(true);
    try {
      const response = await fetch('/api/brevo-credits');
      const data = await response.json();
      if (data.success) {
        setSmsCredits(data.credits);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des crédits:', err);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5 Mo');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (messageType === 'whatsapp' && !selectedTemplate) {
      setError('Veuillez sélectionner un template');
      return;
    }

    if (!customText) {
      setError('Veuillez entrer un message');
      return;
    }

    if (messageType === 'sms') {
      if (smsCredits !== null && smsCredits < selectedUserIds.length) {
        const missingCredits = selectedUserIds.length - smsCredits;
        const errorMessage = `Crédits SMS insuffisants. Vous avez ${smsCredits} crédit(s) disponible(s) mais ${selectedUserIds.length} SMS doivent être envoyés (1 crédit = 1 SMS). Il manque ${missingCredits} crédit(s). Veuillez recharger vos crédits SMS sur votre compte Brevo avant de continuer.`;
        setError(errorMessage);
        toast.error('Crédits SMS insuffisants', {
          description: `Il manque ${missingCredits} crédit(s) pour envoyer ${selectedUserIds.length} SMS.`,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('messageType', messageType);
      if (messageType === 'whatsapp') {
        formData.append('template', selectedTemplate);
        if (imageFile) {
          formData.append('image', imageFile);
        }
      }
      formData.append('text', customText);
      formData.append('userIds', JSON.stringify(selectedUserIds));

      const response = await fetch('/api/send-annonce', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (messageType === 'sms' && data.credits) {
          const successMessage = `Campagne SMS créée avec succès !`;
          const description = `${data.sent} SMS envoyé(s) sur ${data.total} utilisateur(s). ${data.failed > 0 ? `${data.failed} échec(s).` : ''} Crédits utilisés : ${data.credits.used} (reste ${data.credits.remaining})`;
          
          toast.success(successMessage, {
            description: description,
            duration: 5000,
          });
          
          if (data.details?.contactsErrors?.length > 0) {
            setTimeout(() => {
              toast.warning('Certains contacts ont échoué', {
                description: `${data.details.contactsErrors.length} contact(s) n'a/ont pas pu être ajouté(s).`,
                duration: 5000,
              });
            }, 1000);
          }
        } else {
          toast.success(data.message || 'Annonce envoyée avec succès !', {
            duration: 3000,
          });
        }
        
        setMessage(data.message || 'Annonce envoyée avec succès !');
        setTimeout(() => {
          onClose();
          setMessageType('sms');
          setSelectedTemplate('');
          setCustomText('');
          setImageFile(null);
          setImagePreview(null);
          setMessage('');
          setCharCount(0);
        }, 2000);
      } else {
        const errorMessage = data.error || 'Échec de l\'envoi de l\'annonce';
        setError(errorMessage);
        toast.error('Erreur lors de l\'envoi', {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (err) {
      const errorMessage = 'Une erreur est survenue lors de l\'envoi';
      setError(errorMessage);
      toast.error('Erreur', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate__animated animate__zoomIn max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text">
            Faire mon annonce
          </h2>
          <p className="text-sm text-gray-400">
            📍 Étape 2 sur 2 : Personnalisez votre annonce pour {selectedUserIds.length} utilisateur(s)
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg animate__animated animate__shakeX">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg animate__animated animate__fadeInDown">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Type de message
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={whatsappMaintenance}
                onClick={() => !whatsappMaintenance && setMessageType('whatsapp')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 relative ${
                  whatsappMaintenance
                    ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                    : messageType === 'whatsapp'
                    ? 'border-green-500 bg-green-900/30 transform hover:scale-105'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500 transform hover:scale-105'
                }`}
              >
                {whatsappMaintenance && (
                  <span className="absolute top-2 right-2 bg-yellow-600 text-yellow-100 text-xs font-semibold px-2 py-1 rounded-full">
                    En maintenance
                  </span>
                )}
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className={`w-12 h-12 ${whatsappMaintenance ? 'opacity-50' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span className={`font-medium ${whatsappMaintenance ? 'text-gray-500' : 'text-white'}`}>WhatsApp</span>
                  <span className={`text-xs ${whatsappMaintenance ? 'text-gray-600' : 'text-gray-400'}`}>Template + Image</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMessageType('sms')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                  messageType === 'sms'
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-white font-medium">SMS</span>
                  <span className="text-xs text-gray-400">Texte uniquement</span>
                </div>
              </button>
            </div>
          </div>

          {messageType === 'whatsapp' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                required
              >
                <option value="">Sélectionner un template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message {messageType === 'sms' && <span className="text-gray-500">({charCount} caractères)</span>}
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={messageType === 'sms' ? 6 : 4}
              maxLength={messageType === 'sms' ? 160 : undefined}
              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 hover:bg-gray-600 resize-none"
              placeholder={messageType === 'sms' ? 'Entrez votre message SMS (max 160 caractères)...' : 'Entrez votre message...'}
              required
            />
            {messageType === 'sms' && (
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {charCount}/160 caractères
                </span>
                {charCount > 160 && (
                  <span className="text-xs text-red-400">
                    Limite dépassée
                  </span>
                )}
              </div>
            )}
          </div>

          {messageType === 'whatsapp' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image (optionnel)
              </label>
              <input
                key={selectedTemplate}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 hover:bg-gray-600"
              />
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Aperçu :</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-700 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-400">
              📊 <strong>{selectedUserIds.length}</strong> utilisateur(s) sélectionné(s) recevront cette annonce
            </p>
            {messageType === 'sms' && (
              <div className="pt-2 border-t border-gray-600">
                {isLoadingCredits ? (
                  <p className="text-xs text-gray-500">Chargement des crédits...</p>
                ) : smsCredits !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Crédits SMS disponibles:</span>
                    <span className={`text-sm font-semibold ${
                      smsCredits >= selectedUserIds.length 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {smsCredits}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-yellow-400">Impossible de récupérer les crédits</p>
                )}
                {smsCredits !== null && smsCredits < selectedUserIds.length && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Crédits insuffisants ! Vous avez {smsCredits} crédit(s) mais {selectedUserIds.length} SMS seront envoyés.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                isLoading || 
                (messageType === 'sms' && charCount > 160) ||
                (messageType === 'sms' && smsCredits !== null && smsCredits < selectedUserIds.length)
              }
              className={`flex-1 text-white px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                messageType === 'whatsapp'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
              }`}
            >
              {isLoading ? 'Envoi...' : `Envoyer par ${messageType === 'whatsapp' ? 'WhatsApp' : 'SMS'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    firstName: '',
    lastName: '',
    postalCode: '',
    birthDate: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Échec de la création de l\'utilisateur');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate__animated animate__zoomIn">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text">Ajouter un utilisateur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg animate__animated animate__shakeX">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Numéro de téléphone"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
            required
          />
          <input
            type="text"
            placeholder="Prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <input
            type="text"
            placeholder="Nom de famille"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <input
            type="text"
            placeholder="Code postal"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <input
            type="date"
            placeholder="Date de naissance"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Ajouter l'utilisateur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ isOpen, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    phoneNumber: user.phoneNumber || '',
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    postalCode: user.postalCode || '',
    birthDate: user.birthDate || '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Échec de la mise à jour de l\'utilisateur');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate__animated animate__zoomIn">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text">Modifier l'utilisateur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg animate__animated animate__shakeX">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Numéro de téléphone"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
            required
          />
          <input
            type="text"
            placeholder="Prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <input
            type="text"
            placeholder="Nom de famille"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <input
            type="text"
            placeholder="Code postal"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <input
            type="date"
            placeholder="Date de naissance"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
          />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Mettre à jour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}