/**
 * გადაკეთება tkt.ge API ფორმატისთვის
 */
function formatForTkt(hud, events, batches) {
    return {
        hud_id: hud.id,
        title: hud.title,
        description: hud.description,
        cover: hud.cover,
        events: events.map(ev => ({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            start_datetime: ev.start_datetime,
            end_datetime: ev.end_datetime,
            min_price: ev.min_price,
            max_price: ev.max_price,
            batches: batches
                .filter(b => b.event_id === ev.id)
                .map(b => ({
                    id: b.id,
                    name: b.name,
                    price: b.price,
                    capacity: b.capacity,
                    sold_count: b.sold_count,
                }))
        }))
    };
}

/**
 * გადაკეთება biletebi.ge API ფორმატისთვის
 */
function formatForBiletebi(hud, events, batches) {
    return {
        hood: {
            id: hud.id,
            title: hud.title,
            description: hud.description,
            cover: hud.cover,
        },
        events: events.map(ev => ({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            start: ev.start_datetime,
            end: ev.end_datetime,
            price: {
                min: ev.min_price,
                max: ev.max_price,
            },
            batches: batches
                .filter(b => b.event_id === ev.id)
                .map(b => ({
                    id: b.id,
                    name: b.name,
                    price: b.price,
                    capacity: b.capacity,
                    sold: b.sold_count,
                }))
        }))
    };
}

module.exports = {
    formatForTkt,
    formatForBiletebi,
};
