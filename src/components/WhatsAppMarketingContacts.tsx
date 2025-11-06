import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Users, Upload, Download, Search } from 'lucide-react';

interface ContactList {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Contact {
  id: string;
  list_id: string;
  name: string;
  phone_number: string;
  email: string;
  tags: string[];
  notes: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  created_at: string;
}

export default function WhatsAppMarketingContacts() {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [showListForm, setShowListForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [listFormData, setListFormData] = useState({
    name: '',
    description: '',
  });
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    tags: '',
    notes: '',
    status: 'active' as Contact['status'],
  });

  useEffect(() => {
    loadContactLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      loadContacts(selectedList.id);
    }
  }, [selectedList]);

  const loadContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactLists(data || []);
      if (data && data.length > 0 && !selectedList) {
        setSelectedList(data[0]);
      }
    } catch (error) {
      console.error('Error loading contact lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_marketing_contacts')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedList && showListForm) {
        const { error } = await supabase
          .from('whatsapp_contact_lists')
          .update(listFormData)
          .eq('id', selectedList.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_contact_lists')
          .insert([listFormData]);

        if (error) throw error;
      }

      setShowListForm(false);
      setListFormData({ name: '', description: '' });
      loadContactLists();
    } catch (error) {
      console.error('Error saving contact list:', error);
      alert('Failed to save contact list');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;

    try {
      const tags = contactFormData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const contactData = {
        ...contactFormData,
        tags,
        list_id: selectedList.id,
      };

      if (selectedContact) {
        const { error } = await supabase
          .from('whatsapp_marketing_contacts')
          .update(contactData)
          .eq('id', selectedContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_marketing_contacts')
          .insert([contactData]);

        if (error) throw error;
      }

      setShowContactForm(false);
      setSelectedContact(null);
      setContactFormData({
        name: '',
        phone_number: '',
        email: '',
        tags: '',
        notes: '',
        status: 'active',
      });
      loadContacts(selectedList.id);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact');
    }
  };

  const handleEditList = (list: ContactList) => {
    setListFormData({
      name: list.name,
      description: list.description,
    });
    setShowListForm(true);
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact list? All contacts in this list will also be deleted.')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_contact_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedList?.id === id) {
        setSelectedList(null);
        setContacts([]);
      }
      loadContactLists();
    } catch (error) {
      console.error('Error deleting contact list:', error);
      alert('Failed to delete contact list');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email,
      tags: contact.tags.join(', '),
      notes: contact.notes,
      status: contact.status,
    });
    setShowContactForm(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_marketing_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (selectedList) {
        loadContacts(selectedList.id);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !selectedList) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          const nameIndex = headers.indexOf('name');
          const phoneIndex = headers.indexOf('phone');
          const emailIndex = headers.indexOf('email');
          const tagsIndex = headers.indexOf('tags');

          if (nameIndex === -1 || phoneIndex === -1) {
            alert('CSV must have "name" and "phone" columns');
            return;
          }

          const contactsToImport = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const tags = tagsIndex !== -1 && values[tagsIndex]
              ? values[tagsIndex].split(';').map(t => t.trim())
              : [];

            contactsToImport.push({
              list_id: selectedList.id,
              name: values[nameIndex],
              phone_number: values[phoneIndex],
              email: emailIndex !== -1 ? values[emailIndex] : '',
              tags,
              notes: '',
              status: 'active' as const,
            });
          }

          if (contactsToImport.length === 0) {
            alert('No valid contacts found in CSV');
            return;
          }

          const { error } = await supabase
            .from('whatsapp_marketing_contacts')
            .insert(contactsToImport);

          if (error) throw error;

          alert(`Successfully imported ${contactsToImport.length} contacts!`);
          loadContacts(selectedList.id);
        } catch (error) {
          console.error('Error importing CSV:', error);
          alert('Failed to import contacts');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      alert('No contacts to export');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Tags', 'Status', 'Notes'];
    const rows = contacts.map(contact => [
      contact.name,
      contact.phone_number,
      contact.email,
      contact.tags.join(';'),
      contact.status,
      contact.notes,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${selectedList?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone_number.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Contact['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      unsubscribed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Marketing Contacts</h2>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Lists</h3>
              <button
                onClick={() => {
                  setShowListForm(true);
                  setListFormData({ name: '', description: '' });
                }}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="New List"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showListForm && (
              <form onSubmit={handleListSubmit} className="mb-4 p-4 bg-gray-50 rounded-md space-y-3">
                <input
                  type="text"
                  required
                  placeholder="List Name"
                  value={listFormData.name}
                  onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={listFormData.description}
                  onChange={(e) => setListFormData({ ...listFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowListForm(false)}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {contactLists.map((list) => (
                <div
                  key={list.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedList?.id === list.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setSelectedList(list)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <h4 className="font-medium text-gray-900 truncate">{list.name}</h4>
                      </div>
                      {list.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{list.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditList(list);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {contactLists.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No contact lists yet. Create one to get started!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          {selectedList ? (
            <div className="bg-white shadow-md rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedList.name}</h3>
                    <p className="text-sm text-gray-500">{contacts.length} contacts</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleImportCSV}
                      className="flex items-center space-x-2 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import CSV</span>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center space-x-2 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowContactForm(true);
                        setSelectedContact(null);
                        setContactFormData({
                          name: '',
                          phone_number: '',
                          email: '',
                          tags: '',
                          notes: '',
                          status: 'active',
                        });
                      }}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Contact</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {showContactForm && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    {selectedContact ? 'Edit Contact' : 'Add New Contact'}
                  </h4>
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Name"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={contactFormData.phone_number}
                        onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      value={contactFormData.tags}
                      onChange={(e) => setContactFormData({ ...contactFormData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={contactFormData.status}
                      onChange={(e) => setContactFormData({ ...contactFormData, status: e.target.value as Contact['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                    <textarea
                      placeholder="Notes (optional)"
                      value={contactFormData.notes}
                      onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        {selectedContact ? 'Update' : 'Add'} Contact
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowContactForm(false);
                          setSelectedContact(null);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.phone_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(contact.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredContacts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {searchTerm ? 'No contacts match your search' : 'No contacts yet. Add your first contact!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a contact list to view and manage contacts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}