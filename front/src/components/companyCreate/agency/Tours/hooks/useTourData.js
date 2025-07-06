import { useState, useEffect } from 'react';
import { getTourData, getProviders } from '../../../../../services/api';

export const useTourData = () => {
  const [savedTours, setSavedTours] = useState([]);
  const [savedRegions, setSavedRegions] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]);
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [bolgeler, setBolgeler] = useState([]);
  const [regions, setRegions] = useState([]);
  const [counter, setCounter] = useState(0);
  const [bolgeCounter, setBolgeCounter] = useState(0);
  const [regionCounter, setRegionCounter] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
        if (!agencyUser?.companyId) {
          console.warn('Şirket ID bulunamadı');
          return;
        }

        const data = await getTourData(agencyUser.companyId);
        const providersResponse = await getProviders(agencyUser.companyId);
        
        if (providersResponse.data && Array.isArray(providersResponse.data)) {
          const formattedProviders = providersResponse.data.map(provider => ({
            id: Date.now() + Math.random(),
            alphanumericId: provider.companyRef,
            companyName: provider.company_name,
            phoneNumber: provider.phone_number,
            status: provider.status === 1
          }));
          setSavedCompanies(formattedProviders);
          localStorage.setItem('companies', JSON.stringify(formattedProviders));
        }

        if (data) {
          handleDataUpdate(data);
        }

      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };

    fetchAllData();
  }, []);

  const handleDataUpdate = (data) => {
    if (data.tours) {
      setSavedTours(data.tours);
      const maxTourId = Math.max(...data.tours.map(t => t.id), 0);
      setCounter(maxTourId + 1);
    }
    
    if (data.regions) {
      setSavedRegions(data.regions);
      setRegions(data.regions);
      const maxRegionId = Math.max(...data.regions.map(r => r.id), 0);
      setRegionCounter(maxRegionId + 1);
    }

    if (data.areas) {
      setSavedAreas(data.areas);
    }
    
    if (data.bolgeler) {
      setBolgeler(data.bolgeler);
      const maxBolgeId = Math.max(...data.bolgeler.map(b => b.id), 0);
      setBolgeCounter(maxBolgeId + 1);
    }
    
    updateLocalStorage(data);
  };

  const updateLocalStorage = (data) => {
    localStorage.setItem('tourList', JSON.stringify(data.tours || []));
    localStorage.setItem('bolgeList', JSON.stringify(data.bolgeler || []));
    localStorage.setItem('regionList', JSON.stringify(data.regions || []));
    localStorage.setItem('areaList', JSON.stringify(data.areas || []));
  };

  return {
    savedTours,
    savedRegions,
    savedAreas,
    savedCompanies,
    bolgeler,
    regions,
    counter,
    bolgeCounter,
    regionCounter
  };
}; 