import { CURRENCIES } from './constants';

export const isRegionSelected = (regions, regionName) => {
    const selectedRegions = regions ? regions.split(',') : [];
    return selectedRegions.includes(regionName);
};

export const formatTicketForSubmit = (editedTicket) => {
    const restAmountString = CURRENCIES
        .map(currency => {
            const amount = editedTicket.rest_amounts[currency];
            return amount ? `${amount} ${currency}` : null;
        })
        .filter(Boolean)
        .join(', ');

    return {
        ...editedTicket,
        ticket_number: editedTicket.ticket_number,
        adult_count: parseInt(editedTicket.adult_count || 0),
        child_count: parseInt(editedTicket.child_count || 0),
        free_count: parseInt(editedTicket.free_count || 0),
        adult_price: parseFloat(editedTicket.adult_price || 0),
        half_price: parseFloat(editedTicket.child_price || 0),
        total_rest_amount: restAmountString,
        time: `${editedTicket.hour.padStart(2, '0')}:${editedTicket.minute.padStart(2, '0')}`
    };
}; 