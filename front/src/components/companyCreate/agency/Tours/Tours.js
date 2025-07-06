import React, { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TourForm from './components/TourForm';
import TourHeader from './components/TourHeader';
import TourTable from './components/TourTable';
import { DAYS } from './components/form_inputs/DaySelector';
import { INITIAL_TOUR_STATE } from './hooks/constants';
import { useTourData } from './hooks/useTourData';
import { saveAllTours, getAllTours, deleteTour, updateGuidePrices } from '../../../../services/api';

const Tours = () => {
  const [tourData, setTourData] = useState(() => {
    const savedData = localStorage.getItem('currentTourData');
    return savedData ? JSON.parse(savedData) : INITIAL_TOUR_STATE;
  });
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [createdTours, setCreatedTours] = useState(() => {
    const saved = localStorage.getItem('createdTours');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState('all');
  const [selectedBolge, setSelectedBolge] = useState('all');
  const [showStopStatus, setShowStopStatus] = useState('all');
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const {
    savedTours,
    savedRegions,
    savedAreas,
    savedCompanies,
    bolgeler
  } = useTourData();

  // Tüm bölgeleri topla
  const allBolgeler = useMemo(() => {
    const bolgeSet = new Set();
    createdTours.forEach(tour => {
      if (tour.bolgeler && Array.isArray(tour.bolgeler)) {
        tour.bolgeler.forEach(bolge => bolgeSet.add(bolge));
      }
    });
    return Array.from(bolgeSet).sort();
  }, [createdTours]);

  useEffect(() => {
    localStorage.setItem('createdTours', JSON.stringify(createdTours));
  }, [createdTours]);

  useEffect(() => {
    localStorage.setItem('currentTourData', JSON.stringify(tourData));
  }, [tourData]);

  useEffect(() => {
    const loadExistingTours = async () => {
      try {
        const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
        if (!agencyUser?.companyId) {
          return;
        }

        const response = await getAllTours(agencyUser.companyId);
        if (response.success && Array.isArray(response.data)) {
          const formattedTours = response.data.map(tour => ({
            id: tour.mainTour.id,
            tourName: tour.mainTour.tour_name,
            main_tour_name: tour.mainTour.main_tour_name,
            operator: tour.mainTour.operator,
            operatorId: tour.mainTour.operator_id,
            adultPrice: tour.mainTour.adult_price,
            childPrice: tour.mainTour.child_price,
            guideAdultPrice: tour.mainTour.guide_adult_price,
            guideChildPrice: tour.mainTour.guide_child_price,
            isActive: tour.mainTour.is_active,
            priority: tour.mainTour.priority || '0',
            bolgeler: tour.mainTour.bolgeler || [],
            description: tour.mainTour.description || '',
            currency: tour.mainTour.currency || 'EUR',
            start_date: tour.mainTour.start_date || null,
            end_date: tour.mainTour.end_date || null,
            relatedData: {
              days: tour.days || [],
              pickupTimes: (tour.pickupTimes || []).map(time => ({
                ...time,
                company_id: agencyUser.companyId,
                isActive: time.period_active === 1,
                stopSelling: time.start_pickup_date !== null || time.end_pickup_date !== null,
                stopSaleStartDate: time.start_pickup_date,
                stopSaleEndDate: time.end_pickup_date
              })),
              options: tour.options || []
            }
          }));

          setCreatedTours(formattedTours);
        }
      } catch (error) {
        // Hata durumunda sessizce devam et
      }
    };

    loadExistingTours();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'tourName') {
      const selectedOption = formInputs[0].options.find(opt => opt.value === value);
      setTourData(prev => ({
        ...prev,
        [name]: value,
        main_tour_name: selectedOption?.main_tour_name || value
      }));
    } else {
      setTourData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    setTourData(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleDaySelect = (day, clearAll = false) => {
    setTourData(prev => {
      if (clearAll) {
        // Tüm günleri kaldır
        return { ...prev, selectedDays: [] };
      }
      
      const selectedDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays };
    });
  };

  const handleSelectAllDays = () => {
    setTourData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.length === DAYS.length ? [] : DAYS.map(day => day.id)
    }));
  };

  const resetForm = () => {
    setTourData(INITIAL_TOUR_STATE);
    setEditingIndex(null);
    setIsCollapsed(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tourData.tourName || !tourData.operator) {
      alert('Lütfen gerekli alanları doldurunuz!');
      return;
    }

    console.log('Submit sırasında tourData:', tourData);

    const selectedCompany = savedCompanies.find(c => c.alphanumericId === tourData.operator);
    
    const mainTourData = {
      tourName: tourData.tourName,
      main_tour_name: tourData.main_tour_name,
      operator: selectedCompany ? selectedCompany.companyName : tourData.operator,
      operatorId: selectedCompany ? selectedCompany.alphanumericId : tourData.operator,
      adultPrice: tourData.adultPrice || 0,
      childPrice: tourData.childPrice || 0,
      guideAdultPrice: tourData.guideAdultPrice || 0,
      guideChildPrice: tourData.guideChildPrice || 0,
      currency: tourData.currency || 'EUR',
      isActive: true,
      priority: tourData.priority || '0',
      tourGroup: tourData.tourGroup,
      bolgeId: tourData.bolgeId || [],
      bolgeler: tourData.bolgeId ? tourData.bolgeId.map(id => 
        bolgeler.find(bolge => bolge.id === id)?.name || ''
      ) : [],
      description: tourData.description || '',
      start_date: tourData.start_date || null,
      end_date: tourData.end_date || null
    };


    // Boş olmayan pickup zamanlarını filtrele
    const filteredPickupTimes = tourData.pickupTimes
      .filter(time => time.hour || time.minute || time.region || time.area)
      .map(time => ({
        ...time,
        hour: time.hour || '00',
        minute: time.minute || '00',
        region: time.region || '',
        area: time.area || '',
        period: time.period || '1',
        isActive: time.isActive === undefined ? true : time.isActive
      }));

    const days = Array.isArray(tourData.selectedDays) && tourData.selectedDays.length > 0 
      ? tourData.selectedDays 
      : [0];

    const relatedData = {
      days,
      pickupTimes: filteredPickupTimes,
      options: Array.isArray(tourData.options) ? 
        tourData.options.filter(opt => opt.name || opt.price) : []
    };

    if (editingIndex !== null) {
      setCreatedTours(prev => {
        const newTours = [...prev];
        const updatedTour = {
          ...mainTourData,
          relatedData,
          id: prev[editingIndex]?.id // ID'yi koru
        };
        console.log('Düzenlenen tur:', updatedTour);
        newTours[editingIndex] = updatedTour;
        return newTours;
      });
    } else {
      setCreatedTours(prev => {
        const newTour = {
          ...mainTourData,
          relatedData,
          id: null
        };
        console.log('Eklenen yeni tur:', newTour);
        return [...prev, newTour];
      });
    }

    resetForm();
  };

  const handleEdit = (tour) => {
    const index = createdTours.findIndex(t => t === tour);
    if (index !== -1) {
      const operatorId = tour.operatorId || 
        (savedCompanies.find(c => c.companyName === tour.operator)?.alphanumericId || tour.operator);
      
      const selectedBolgeIds = bolgeler
        .filter(bolge => tour.bolgeler?.includes(bolge.name))
        .map(bolge => bolge.id);

      const editableTourData = {
        tourName: tour.tourName,
        main_tour_name: tour.main_tour_name,
        operator: operatorId,
        adultPrice: tour.adultPrice || '',
        childPrice: tour.childPrice || '',
        guideAdultPrice: tour.guideAdultPrice || '',
        guideChildPrice: tour.guideChildPrice || '',
        selectedDays: tour.relatedData?.days || [],
        tourGroup: tour.tourGroup,
        bolgeId: selectedBolgeIds,
        pickupTimes: [
          ...(tour.relatedData?.pickupTimes?.map(time => ({
            hour: time.hour || '',
            minute: time.minute || '',
            region: time.region || '',
            area: time.area || '',
            isActive: time.isActive !== false,
            period: time.period || '1',
            stopSaleStartDate: time.stopSaleStartDate || time.start_pickup_date,
            stopSaleEndDate: time.stopSaleEndDate || time.end_pickup_date,
            start_pickup_date: time.start_pickup_date,
            end_pickup_date: time.end_pickup_date,
            stopSelling: time.stopSelling || (time.start_pickup_date !== null || time.end_pickup_date !== null)
          })) || []),
          {
            hour: '',
            minute: '',
            region: '',
            area: '',
            isActive: true,
            period: '1',
            stopSaleStartDate: null,
            stopSaleEndDate: null,
            start_pickup_date: null,
            end_pickup_date: null,
            stopSelling: false
          }
        ],
        options: tour.relatedData?.options?.map(opt => ({
          name: opt.option_name || opt.name || '',
          price: opt.price || ''
        })) || [],
        priority: tour.priority || '0',
        isActive: tour.isActive,
        description: tour.description || '',
        currency: tour.currency || 'EUR'
      };
      
      setTourData(editableTourData);
      setEditingIndex(index);
      setIsCollapsed(false);
    }
  };

  const handleCopy = (tourToCopy) => {
    const copiedTour = {
      ...tourToCopy,
      id: null,  // Yeni kopya için ID'yi null yapıyoruz
      tourName: `${tourToCopy.tourName} (Kopya)`, // Kopya olduğunu belirtmek için
      main_tour_name: tourToCopy.main_tour_name, // Ana tur adını kopyala
      relatedData: {
        ...tourToCopy.relatedData,
        pickupTimes: tourToCopy.relatedData.pickupTimes.map(time => ({
          ...time,
          id: null // Pickup time ID'lerini de null yapıyoruz
        })),
        options: tourToCopy.relatedData.options.map(option => ({
          ...option,
          id: null // Option ID'lerini de null yapıyoruz
        }))
      }
    };
    setCreatedTours(prev => [...prev, copiedTour]);
  };

  const handleDelete = (tourToDelete) => {
    // Sadece state'den sil, veritabanı işlemi yapma
    setCreatedTours(prev => prev.filter(tour => 
      // ID'si varsa ID'ye göre, yoksa içerik karşılaştırması yap
      tour.id ? tour.id !== tourToDelete.id : 
      !(tour.tourName === tourToDelete.tourName && 
        tour.operator === tourToDelete.operator)
    ));
    
    if (editingIndex !== null) {
      resetForm();
    }
  };

  const handleTimeChange = (index, field, value) => {
    setTourData(prev => {
      const newTimes = [...(prev.pickupTimes || [])];
      if (!newTimes[index]) {
        newTimes[index] = {
          hour: '',
          minute: '',
          region: '',
          area: '',
          isActive: true,
          period: '1'
        };
      }
      
      // Bölge değiştiğinde, o bölgeye ait alanı sıfırla
      const updates = { [field]: value };
      if (field === 'region') {
        updates.area = '';
        updates.period = '1';
      }
      
      newTimes[index] = { 
        ...newTimes[index], 
        ...updates
      };
      
      return { ...prev, pickupTimes: newTimes };
    });
  };

  const addPickupTime = () => {
    setTourData(prev => ({
      ...prev,
      pickupTimes: [
        ...prev.pickupTimes,
        {
          hour: '',
          minute: '',
          region: '',
          area: '',
          period: '1',
          isActive: true
        }
      ]
    }));
  };

  const removePickupTime = (index) => {
    setTourData(prev => ({
      ...prev,
      pickupTimes: prev.pickupTimes.filter((_, i) => i !== index)
    }));
  };

  const formInputs = useMemo(() => [
    {
      label: 'Tur Adı',
      icon: 'bi-map',
      id: 'tourName',
      type: 'autocomplete',
      placeholder: 'Tur adı yazın veya seçin',
      options: savedTours.flatMap(tour => [
        {
          value: tour.name,
          label: `📁 ${tour.name}`,
          searchTerms: tour.name.toLowerCase(),
          mainTourName: tour.name,
          main_tour_name: tour.name
        },
        ...(tour.subTours?.map(subTour => ({
          value: subTour.name,
          label: `  ↳ ${subTour.name}`,
          searchTerms: `${tour.name} ${subTour.name}`.toLowerCase(),
          mainTourName: tour.name,
          main_tour_name: tour.name
        })) || [])
      ])
    },
    {
      label: 'Operatör Seç',
      icon: 'bi-person-badge',
      id: 'operator',
      type: 'select',
      placeholder: 'Operatör seçiniz',
      options: savedCompanies.map(company => ({ 
        value: company.alphanumericId, 
        label: `${company.companyName} (${company.alphanumericId})` 
      }))
    },
    {
      label: 'Tur Önceliği',
      icon: 'bi-sort-numeric-down',
      id: 'priority',
      type: 'select',
      placeholder: 'Öncelik seçiniz',
      options: [
        { value: '1', label: '1 - En Yüksek' },
        { value: '2', label: '2 - Yüksek' },
        { value: '3', label: '3 - Normal' },
        { value: '4', label: '4 - Düşük' },
        { value: '5', label: '5 - En Düşük' }
      ]
    }
  ], [savedTours, savedCompanies]);

  const filteredAndSortedTours = useMemo(() => {
    return createdTours
      .filter(tour => {
        // Arama filtresi
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = tour.tourName.toLowerCase().includes(searchLower) ||
                            tour.operator.toLowerCase().includes(searchLower);

        // Aktiflik durumu filtresi
        const matchesStatus = showActive === 'all' ||
          (showActive === 'active' && tour.isActive) ||
          (showActive === 'inactive' && !tour.isActive);

        // Bölge filtresi
        const matchesBolge = selectedBolge === 'all' ||
          (tour.bolgeler && tour.bolgeler.includes(selectedBolge));

        // Stop durumu filtresi
        const hasStopDates = tour.start_date || tour.end_date;
        const matchesStopStatus = showStopStatus === 'all' ||
          (showStopStatus === 'stopped' && hasStopDates);

        return matchesSearch && matchesStatus && matchesBolge && matchesStopStatus;
      })
      .sort((a, b) => {
        // Önce operatöre göre sırala
        const operatorCompare = a.operator.localeCompare(b.operator);
        if (operatorCompare !== 0) return operatorCompare;

        // Önceliği olmayan turları en sona koy
        const hasPriorityA = a.priority && a.priority !== '0';
        const hasPriorityB = b.priority && b.priority !== '0';
        
        if (hasPriorityA && !hasPriorityB) return -1; // a'yı öne al
        if (!hasPriorityA && hasPriorityB) return 1;  // b'yi öne al
        
        // Her ikisinin de önceliği varsa veya yoksa
        if (hasPriorityA && hasPriorityB) {
          // Öncelik değerlerine göre sırala (küçük sayı = yüksek öncelik)
          const priorityA = parseInt(a.priority);
          const priorityB = parseInt(b.priority);
          if (priorityA !== priorityB) return priorityA - priorityB;
        }

        // Son olarak tur adına göre sırala
        return a.tourName.localeCompare(b.tourName);
      });
  }, [createdTours, searchQuery, showActive, selectedBolge, showStopStatus]);

  const handleStatusChange = (tourId) => {
    setCreatedTours(prev => prev.map(tour => {
      if (tour === tourId) {
        const updatedTour = { ...tour, isActive: !tour.isActive };
        return updatedTour;
      }
      return tour;
    }));
  };

  const handlePickupTimeStatusChange = (tourIndex, pickupTimeIndex) => {
    setCreatedTours(prev => {
      const newTours = [...prev];
      const tour = { ...newTours[tourIndex] };
      
      if (!tour?.relatedData?.pickupTimes?.[pickupTimeIndex]) {
        return prev;
      }

      const pickupTimes = [...tour.relatedData.pickupTimes];
      const currentTime = pickupTimes[pickupTimeIndex];

      // isActive değerinin varlığını kontrol edelim ve sadece isActive'i değiştirelim
      // Diğer özellikleri (stop değerleri dahil) koruyalım
      pickupTimes[pickupTimeIndex] = {
        ...currentTime,  // Mevcut tüm özellikleri koru
        isActive: currentTime.isActive === undefined ? false : !currentTime.isActive
        // start_pickup_date, end_pickup_date gibi stop değerleri korunacak
      };
      
      tour.relatedData = {
        ...tour.relatedData,
        pickupTimes
      };
      
      newTours[tourIndex] = tour;
      return newTours;
    });
  };

  const handleDayStatusChange = (tourIndex, dayId) => {
    setCreatedTours(prev => {
      const newTours = [...prev];
      const tour = { ...newTours[tourIndex] };
      
      // Eğer days dizisi yoksa oluştur
      if (!Array.isArray(tour.relatedData?.days)) {
        tour.relatedData = {
          ...tour.relatedData,
          days: []
        };
      }

      // Günleri kopyala
      const days = [...tour.relatedData.days];
      
      // Gün zaten seçili mi kontrol et
      const dayIndex = days.indexOf(dayId);
      if (dayIndex !== -1) {
        // Gün seçili, kaldır
        days.splice(dayIndex, 1);
      } else {
        // Gün seçili değil, ekle
        days.push(dayId);
      }

      // Günleri sırala
      days.sort((a, b) => a - b);

      // Güncellenmiş tour nesnesini oluştur
      tour.relatedData = {
        ...tour.relatedData,
        days
      };
      
      newTours[tourIndex] = tour;
      return newTours;
    });
  };

  const handleDateChange = (tour, field, value) => {
    setCreatedTours(prev => {
      const newTours = prev.map(t => {
        if (t.id === tour.id) {
          // Yeni tur durumunu oluştur
          const updatedTour = { ...t, [field]: value };
          
          // Turun durdurma durumunu kontrol et
          const hasStopDates = updatedTour.start_date || updatedTour.end_date;
          const hasStopPickupTimes = updatedTour.relatedData?.pickupTimes?.some(
            time => time.stopSaleStartDate || time.stopSaleEndDate
          );
          
          // Eğer tüm durdurma tarihleri kaldırıldıysa uyarı göster
          if (!hasStopDates && !hasStopPickupTimes) {
            setShowSaveAlert(true);
            setTimeout(() => {
              setShowSaveAlert(false);
            }, 5000);
          }
          
          return updatedTour;
        }
        return t;
      });
      
      return newTours;
    });
  };

  const handleSaveToDatabase = async () => {
    try {
      const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
      if (!agencyUser?.companyId) {
        alert('Şirket bilgisi bulunamadı!');
        return;
      }

      const toursToSave = createdTours.map(tour => {
        // Tarihleri doğru formatta hazırla
        const formatDate = (dateString) => {
          if (!dateString) return null;
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            
            // Tarihi YYYY-MM-DD formatına çevir
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
          } catch (error) {
            console.error('Tarih formatı hatası:', error);
            return null;
          }
        };

        // Tarihleri kontrol et ve formatla
        const start_date = formatDate(tour.start_date);
        const end_date = formatDate(tour.end_date);

        console.log('Tur tarihleri:', {
          original_start: tour.start_date,
          original_end: tour.end_date,
          formatted_start: start_date,
          formatted_end: end_date
        });

        const pickupTimes = tour.relatedData.pickupTimes.map(time => {
          // Pickup zamanlarının tarihlerini kontrol et ve formatla
          const start_pickup_date = formatDate(time.stopSaleStartDate || time.start_pickup_date);
          const end_pickup_date = formatDate(time.stopSaleEndDate || time.end_pickup_date);

          console.log('Pickup time tarihleri:', {
            original_start: time.stopSaleStartDate || time.start_pickup_date,
            original_end: time.stopSaleEndDate || time.end_pickup_date,
            formatted_start: start_pickup_date,
            formatted_end: end_pickup_date
          });

          return {
            ...time,
            company_id: agencyUser.companyId,
            start_pickup_date,
            end_pickup_date,
            isActive: time.isActive !== false,
            period: time.period || '1',
            hour: time.hour || '00',
            minute: time.minute || '00',
            region: time.region || '',
            area: time.area || ''
          };
        });

        const tourData = {
          mainTour: {
            company_ref: agencyUser.companyId,
            tour_name: tour.tourName,
            main_tour_name: tour.main_tour_name,
            operator: tour.operator,
            operator_id: tour.operatorId,
            adult_price: tour.adultPrice,
            child_price: tour.childPrice,
            guide_adult_price: tour.guideAdultPrice,
            guide_child_price: tour.guideChildPrice,
            is_active: Boolean(tour.isActive),
            bolge_id: tour.bolgeId || [],
            bolgeler: tour.bolgeler || [],
            priority: tour.priority || '0',
            description: tour.description || '',
            currency: tour.currency || 'EUR',
            start_date,
            end_date
          },
          days: tour.relatedData.days,
          pickupTimes,
          options: tour.relatedData.options
        };

        console.log('Kaydedilecek tur verisi:', tourData);
        return tourData;
      });

      const response = await saveAllTours(toursToSave);
      
      if (response.success) {
        // Rehber fiyatlarını reservation_tickets tablosunda güncelle
        let guidePriceUpdateMessage = '';
        try {
          const guidePriceUpdateResponse = await updateGuidePrices(agencyUser.companyId);
          console.log('Rehber fiyatları güncelleme sonucu:', guidePriceUpdateResponse);
          if (guidePriceUpdateResponse.updatedTickets > 0) {
            guidePriceUpdateMessage = `\n\nRehber fiyatları ${guidePriceUpdateResponse.updatedTickets} bilet için güncellendi.`;
          }
        } catch (guidePriceError) {
          console.error('Rehber fiyatları güncellenirken hata:', guidePriceError);
          // Rehber fiyatları güncellenemese bile tur kaydı başarılı olduğu için devam et
        }

        const updatedToursResponse = await getAllTours(agencyUser.companyId);
        if (updatedToursResponse.success && Array.isArray(updatedToursResponse.data)) {
          const formattedTours = updatedToursResponse.data.map(tour => ({
            id: tour.mainTour.id,
            tourName: tour.mainTour.tour_name,
            main_tour_name: tour.mainTour.main_tour_name,
            operator: tour.mainTour.operator,
            operatorId: tour.mainTour.operator_id,
            adultPrice: tour.mainTour.adult_price,
            childPrice: tour.mainTour.child_price,
            guideAdultPrice: tour.mainTour.guide_adult_price,
            guideChildPrice: tour.mainTour.guide_child_price,
            isActive: tour.mainTour.is_active,
            priority: tour.mainTour.priority || '0',
            bolgeler: tour.mainTour.bolgeler || [],
            description: tour.mainTour.description || '',
            currency: tour.mainTour.currency || 'EUR',
            start_date: tour.mainTour.start_date,
            end_date: tour.mainTour.end_date,
            relatedData: {
              days: tour.days || [],
              pickupTimes: tour.pickupTimes.map(time => ({
                ...time,
                company_id: agencyUser.companyId,
                isActive: time.period_active === 1,
                stopSelling: time.start_pickup_date !== null || time.end_pickup_date !== null,
                stopSaleStartDate: time.start_pickup_date,
                stopSaleEndDate: time.end_pickup_date
              })),
              options: tour.options || []
            }
          }));

          setCreatedTours(formattedTours);
        }
        alert(`Tüm değişiklikler başarıyla kaydedildi!${guidePriceUpdateMessage}`);
      } else {
        alert('Kayıt sırasında bir hata oluştu: ' + response.message);
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Değişiklikler kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Rehber fiyatlarını manuel olarak güncelleme fonksiyonu
  const handleUpdateGuidePrices = async () => {
    try {
      const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
      if (!agencyUser?.companyId) {
        alert('Şirket bilgisi bulunamadı!');
        return;
      }

      const response = await updateGuidePrices(agencyUser.companyId);
      
      if (response.success) {
        alert(`Rehber fiyatları başarıyla güncellendi!\n\n${response.updatedTickets} bilet güncellendi.`);
      } else {
        alert('Rehber fiyatları güncellenirken bir hata oluştu: ' + response.message);
      }
    } catch (error) {
      console.error('Rehber fiyatları güncelleme hatası:', error);
      alert('Rehber fiyatları güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Tur adını aramaya yazma fonksiyonu
  const handleTourNameClick = (tourName) => {
    setSearchQuery(tourName);
  };

  // Bileşen unmount olduğunda localStorage'ı temizle
  useEffect(() => {
    // Cleanup function
    return () => {
      localStorage.removeItem('currentTourData');
      localStorage.removeItem('createdTours');
      localStorage.removeItem('tourList');
      localStorage.removeItem('bolgeList');
      localStorage.removeItem('regionList');
      localStorage.removeItem('companies');
    };
  }, []); // Boş dependency array ile sadece unmount'ta çalışır

  // Yeni useEffect ekleyelim
  useEffect(() => {
    if (showStopStatus === 'stopped' && filteredAndSortedTours.length === 0) {
      const timer = setTimeout(() => {
        setShowStopStatus('all');
        setShowSaveAlert(true);
        setTimeout(() => {
          setShowSaveAlert(false);
        }, 10000);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showStopStatus, filteredAndSortedTours.length]);

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <TourHeader
          isEditing={editingIndex !== null}
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
          onCancel={resetForm}
        />
        <div className={`card-body ${isCollapsed ? 'd-none' : ''}`}>
          <TourForm
            tourData={tourData}
            formInputs={formInputs}
            savedRegions={savedRegions} 
            savedAreas={savedAreas}
            onSubmit={handleSubmit}
            onChange={handleChange}
            onTimeChange={handleTimeChange}
            onAddTime={addPickupTime}
            onRemoveTime={removePickupTime}
            onOptionChange={handleOptionChange}
            onAddOption={() => setTourData(prev => ({
              ...prev,
              options: [...prev.options, { name: '', price: '' }]
            }))}
            onRemoveOption={(index) => setTourData(prev => ({
              ...prev,
              options: prev.options.filter((_, i) => i !== index)
            }))}
            onDaySelect={handleDaySelect}
            onSelectAllDays={handleSelectAllDays}
            bolgeler={bolgeler}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center g-3">
            <div className="col-12 col-sm-6 col-md-4">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Oluşturulan Turlar
              </h5>
            </div>
            <div className="col-12 col-sm-6 col-md-8">
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-sm-end align-items-sm-center">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tur veya operatör ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchQuery('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                <select
                  className="form-select"
                  value={showStopStatus}
                  onChange={(e) => setShowStopStatus(e.target.value)}
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="stopped">Durdurulmuş</option>
                </select>
                <select
                  className="form-select"
                  value={showActive}
                  onChange={(e) => setShowActive(e.target.value)}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
                <select
                  className="form-select"
                  value={selectedBolge}
                  onChange={(e) => setSelectedBolge(e.target.value)}
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  <option value="all">Tüm Bölgeler</option>
                  {allBolgeler.map(bolge => (
                    <option key={bolge} value={bolge}>
                      {bolge}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {showStopStatus === 'stopped' && filteredAndSortedTours.length === 0 && (
            <div className="alert alert-info" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              Durdurulmuş turlar kaldırıldı..
            </div>
          )}
          {showSaveAlert && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Durdurulmuş turlar kaldırıldı. Lütfen değişiklikleri veri tabanına kaydedin!
            </div>
          )}
          <TourTable 
            tours={filteredAndSortedTours}
            onEdit={handleEdit}
            onDelete={handleDelete}
            bolgeler={bolgeler}
            onCopy={handleCopy}
            onStatusChange={handleStatusChange}
            onPickupTimeStatusChange={handlePickupTimeStatusChange}
            onDayStatusChange={handleDayStatusChange}
            onSaveToDatabase={handleSaveToDatabase}
            onDateChange={handleDateChange}
            onTourNameClick={handleTourNameClick}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
};

export default Tours;
