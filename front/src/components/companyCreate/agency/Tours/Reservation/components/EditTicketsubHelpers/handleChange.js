import { getRegionTours } from '../../../../../../../services/api';

export const handleChange = (e, editedTicket, setEditedTicket, setTours, setTourGroups, tours) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'regions') {
        handleRegionChange(checked, value, editedTicket, setEditedTicket, setTours, setTourGroups);
    } else if (name === 'tour_group_name') {
        handleTourGroupChange(value, editedTicket, setEditedTicket, setTours);
    } else if (name === 'tour_name') {
        handleTourNameChange(value, tours, setEditedTicket);
    } else if (name.startsWith('rest_amount_')) {
        handleRestAmountChange(name, value, setEditedTicket);
    } else {
        setEditedTicket(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }
};

const handleRegionChange = async (checked, value, editedTicket, setEditedTicket, setTours, setTourGroups) => {
    const currentRegions = editedTicket.regions ? editedTicket.regions.split(',') : [];
    let newRegions = checked 
        ? [...currentRegions, value].filter(Boolean)
        : currentRegions.filter(region => region !== value);

    if (newRegions.length === 0) {
        setTours([]);
        setTourGroups([]);
        setEditedTicket(prev => ({
            ...prev,
            regions: '',
            tour_name: '',
            tour_group_name: ''
        }));
        return;
    }

    try {
        const responses = await Promise.all(newRegions.map(region => getRegionTours(region)));
        const allTours = responses.flat();
        const uniqueTours = allTours.filter((tour, index, self) =>
            index === self.findIndex((t) => t.id === tour.id)
        );
        
        const uniqueGroups = extractTourGroups(uniqueTours);
        
        setTours(uniqueTours);
        setTourGroups(uniqueGroups);
        
        setEditedTicket(prev => ({
            ...prev,
            regions: newRegions.join(','),
            tour_name: '',
            tour_group_name: ''
        }));
    } catch (error) {
        console.error('Bölge turları yüklenirken hata:', error);
    }
};

const handleTourGroupChange = async (value, editedTicket, setEditedTicket, setTours) => {
    const selectedRegions = editedTicket.regions ? editedTicket.regions.split(',') : [];
    
    try {
        const responses = await Promise.all(selectedRegions.map(region => getRegionTours(region)));
        const allTours = responses.flat();
        const uniqueTours = allTours.filter((tour, index, self) =>
            index === self.findIndex((t) => t.id === tour.id)
        );
        
        const filteredTours = value ? uniqueTours.filter(tour => tour.group_name === value) : uniqueTours;
        setTours(filteredTours);
        
        setEditedTicket(prev => ({
            ...prev,
            tour_group_name: value,
            tour_name: '',
            adult_price: '0',
            child_price: '0'
        }));
    } catch (error) {
        console.error('Turlar yüklenirken hata:', error);
    }
};

const handleTourNameChange = (value, tours, setEditedTicket) => {
    const selectedTour = tours.find(tour => tour.name === value);
    
    if (selectedTour) {
        setEditedTicket(prev => ({
            ...prev,
            tour_name: value,
            adult_price: String(selectedTour.price),
            child_price: String(selectedTour.child_price),
            currency: selectedTour.currency
        }));
    } else {
        setEditedTicket(prev => ({
            ...prev,
            tour_name: '',
            adult_price: '0',
            child_price: '0'
        }));
    }
};

const handleRestAmountChange = (name, value, setEditedTicket) => {
    const currency = name.split('_')[2];
    setEditedTicket(prev => ({
        ...prev,
        rest_amounts: {
            ...prev.rest_amounts,
            [currency]: value
        }
    }));
};

const extractTourGroups = (tours) => {
    return tours
        .filter(tour => tour.group_name)
        .reduce((groups, tour) => {
            if (!groups.find(g => g.group_name === tour.group_name)) {
                groups.push({
                    id: tour.main_tour_id,
                    group_name: tour.group_name
                });
            }
            return groups;
        }, []);
}; 