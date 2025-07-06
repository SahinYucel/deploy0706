import React, { useState, useEffect } from 'react';
import { getAgencyMembers, deleteAgencyMember, updateAgencyMemberRole, updateAgencyMemberUsername } from '../../../services/api';

function Settings({ company }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editingUsername, setEditingUsername] = useState(false);

  useEffect(() => {
    const agencyUserStr = localStorage.getItem('agencyUser');
    if (agencyUserStr) {
      setLoggedInUser(JSON.parse(agencyUserStr));
    }
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getAgencyMembers(company.id);
        setMembers(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Kullanıcılar yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchMembers();
  }, [company.id]);

  const handleDeleteMember = async (memberId, username, position) => {
    if (loggedInUser?.position !== 'admin') {
      setError('Bu işlem için admin yetkisi gereklidir');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (position === 'admin') {
      const adminCount = members.filter(member => member.position === 'admin').length;
      if (adminCount <= 1) {
        setError('Son admin kullanıcısı silinemez');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    if (!window.confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await deleteAgencyMember(memberId);
      if (response.data.success) {
        setMembers(members.filter(member => member.id !== memberId));
        setSuccess('Kullanıcı başarıyla silindi');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı silinirken bir hata oluştu');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (loggedInUser?.position !== 'admin') {
      setError('Bu işlem için admin yetkisi gereklidir');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const changingMember = members.find(member => member.id === memberId);
    if (changingMember.position === 'admin') {
      const adminCount = members.filter(member => member.position === 'admin').length;
      if (adminCount <= 1) {
        setError('Son admin kullanıcısının rolü değiştirilemez');
        setTimeout(() => setError(''), 3000);
        setEditingMember(null);
        return;
      }
    }

    try {
      await updateAgencyMemberRole(memberId, newRole);
      const updatedMembers = members.map(member => 
        member.id === memberId ? { ...member, position: newRole } : member
      );
      setMembers(updatedMembers);
      setEditingMember(null);
      setSuccess('Kullanıcı rolü başarıyla güncellendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Rol güncellenirken bir hata oluştu');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUsernameChange = async (memberId, newUsername) => {
    if (loggedInUser?.position !== 'admin') {
      setError('Bu işlem için admin yetkisi gereklidir');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await updateAgencyMemberUsername(memberId, newUsername);
      const updatedMembers = members.map(member => 
        member.id === memberId ? { ...member, username: newUsername } : member
      );
      setMembers(updatedMembers);
      setEditingUsername(false);
      setSuccess('Kullanıcı adı başarıyla güncellendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı adı güncellenirken bir hata oluştu');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="container mt-3">Yükleniyor...</div>;
  }

  return (
    <div className="container mt-3">
      <div className="card">
        <div className="card-body">
          <h4 className="card-title mb-4">Şirket Kullanıcıları</h4>
          
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {members.length === 0 ? (
            <div className="alert alert-info">
              Henüz kayıtlı kullanıcı bulunmamaktadır.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Kullanıcı Adı</th>
                    <th>Pozisyon</th>
                    <th>Kayıt Tarihi</th>
                    {loggedInUser?.position === 'admin' && <th className="text-end">İşlemler</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} className={member.position === 'admin' ? 'table-primary' : ''}>
                      <td>
                        {editingUsername && editingMember?.id === member.id ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            defaultValue={member.username}
                            onBlur={(e) => {
                              if (e.target.value !== member.username) {
                                handleUsernameChange(member.id, e.target.value);
                              }
                              setEditingUsername(false);
                              setEditingMember(null);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                if (e.target.value !== member.username) {
                                  handleUsernameChange(member.id, e.target.value);
                                }
                                setEditingUsername(false);
                                setEditingMember(null);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          member.username
                        )}
                      </td>
                      <td>
                        {editingMember?.id === member.id && !editingUsername ? (
                          <select 
                            className="form-select form-select-sm w-auto"
                            defaultValue={member.position}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            onBlur={() => setEditingMember(null)}
                          >
                            <option value="admin">Admin</option>
                            <option value="muhasebe">Muhasebe</option>
                            <option value="operasyon">Operasyon</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            member.position === 'admin' 
                              ? 'bg-primary' 
                              : member.position === 'muhasebe' 
                                ? 'bg-success' 
                                : 'bg-info'
                          }`}>
                            {member.position}
                          </span>
                        )}
                      </td>
                      <td>
                        {new Date(member.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      {loggedInUser?.position === 'admin' && (
                        <td className="text-end">
                          <>
                            <button
                              className="btn btn-outline-secondary btn-sm me-2"
                              onClick={() => {
                                setEditingMember(member);
                                setEditingUsername(true);
                              }}
                              title="Kullanıcı Adını Düzenle"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-primary btn-sm me-2"
                              onClick={() => {
                                setEditingMember(member);
                                setEditingUsername(false);
                              }}
                              title="Rolü Düzenle"
                            >
                              <i className="bi bi-shield"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteMember(member.id, member.username, member.position)}
                              title="Kullanıcıyı Sil"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {loggedInUser?.position === 'admin' && (
            <div className="alert alert-info mt-3 mb-0">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Not:</strong> Admin kullanıcıları üzerinde düzenleme yapılamaz.
              {members.filter(m => m.position === 'admin').length > 0 && (
                <span className="ms-2">(Admin kullanıcıları mavi ile işaretlenmiştir)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings; 