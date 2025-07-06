import { useEffect } from 'react';
import { getReservationRegions, getRegionTours, getTicketOptions } from '../../../../../../../services/api';
import { CURRENCIES } from './constants';

export const useTicketEffects = (show, ticket, setEditedTicket, setRegions, setTours, setTourGroups, setOptions) => {
    // Modal kapandığında state'leri temizle
    useEffect(() => {
        if (!show) {
            setTours([]);
            setTourGroups([]);
        }
    }, [show]);

    // Bölgeleri yükle
    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const regionsData = await getReservationRegions();
                setRegions(regionsData);

                if (ticket?.regions) {
                    const selectedRegions = ticket.regions.split(',');
                    const responses = await Promise.all(selectedRegions.map(region => getRegionTours(region)));
                    const allTours = responses.flat();
                    const uniqueTours = allTours.filter((tour, index, self) =>
                        index === self.findIndex((t) => t.id === tour.id)
                    );
                    
                    const uniqueGroups = uniqueTours
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
                    
                    const filteredTours = ticket.tour_group_name 
                        ? uniqueTours.filter(tour => tour.group_name === ticket.tour_group_name)
                        : uniqueTours;
                    
                    setTours(filteredTours);
                    setTourGroups(uniqueGroups);
                }
            } catch (error) {
                console.error('Bölgeler yüklenirken hata:', error);
            }
        };
        
        fetchRegions();
    }, [ticket]);

    // Ticket verilerini güncelle
    useEffect(() => {
        if (show && ticket) {
            const amounts = {};
            const amountPairs = (ticket.total_rest_amount || '').split(',').map(pair => pair.trim());
            
            CURRENCIES.forEach(currency => {
                amounts[currency] = '';
            });

            amountPairs.forEach(pair => {
                const [amount, currency] = pair.split(' ');
                if (amount && currency) {
                    amounts[currency] = amount;
                }
            });

            const [hour = '', minute = ''] = (ticket.time || '').split(':');

            setEditedTicket({
                ...ticket,
                date: ticket.date?.split('T')[0],
                adult_count: String(ticket.adult_count || 0),
                child_count: String(ticket.child_count || 0),
                free_count: String(ticket.free_count || 0),
                adult_price: String(ticket.adult_price || 0),
                child_price: String(ticket.half_price || 0),
                hour,
                minute,
                rest_amounts: amounts,
                status: ticket.status === 1
            });
        }
    }, [ticket, show]);

    // Opsiyonları yükle
    useEffect(() => {
        if (show && ticket?.id) {
            getTicketOptions(ticket.id)
                .then(data => {
                    setOptions(data);
                })
                .catch(error => {
                    console.error('Opsiyonlar yüklenirken hata:', error);
                });
        }
    }, [show, ticket]);
}; 