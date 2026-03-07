document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map
    // Coordinates for Tashkent, Uzbekistan
    const map = L.map('map', {
        zoomControl: false // We will add it manually to position it
    }).setView([41.2995, 69.2401], 12);

    // Add grayscale/light map tiles similar to Google Maps startup styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    let routingControl = null;
    let userMarker = null;

    // Custom Icon for Stations
    const stationIconHtml = `<div class="custom-marker"></div>`;

    const stationIcon = L.divIcon({
        html: stationIconHtml,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });

    let currentMarkers = [];
    let currentStations = [];
    let favoriteStations = JSON.parse(localStorage.getItem('favoriteStations') || '[]');

    // 2. Fetch DOM elements
    const searchInput = document.getElementById('searchInput');
    const regionFilter = document.getElementById('regionFilter');
    const fuelFilter = document.getElementById('fuelFilter');
    const stationList = document.getElementById('stationList');
    const stationCount = document.getElementById('stationCount');
    const locateMeBtn = document.getElementById('locateMeBtn');

    // Closest Card Overlay elements
    const closestCard = document.getElementById('closestStationCard');
    const closestName = document.getElementById('closestName');
    const closestDesc = document.getElementById('closestDesc');
    const closestTime = document.getElementById('closestTime');
    const closestImgContainer = document.getElementById('overlayImgContainer');
    const closestPrices = document.querySelector('.overlay-prices');

    const pills = document.querySelectorAll('.pill');
    let activePillFilter = 'all';

    // 3. Fetch Data API
    const fetchStations = async () => {
        const search = searchInput.value;
        const region = regionFilter.value;
        const fuel = fuelFilter.value;

        const url = new URL(window.location.origin + '/api/stations/');
        const params = { search, region, fuel_type: fuel };
        Object.keys(params).forEach(key => params[key] && url.searchParams.append(key, params[key]));

        try {
            const res = await fetch(url);
            const data = await res.json();
            currentStations = data.stations;
            renderUI();
        } catch (err) {
            console.error('Error fetching stations:', err);
            stationList.innerHTML = '<div class="loading-state">Error loading stations.</div>';
        }
    };

    // 4. Render UI (Map & Sidebar)
    const renderUI = () => {
        // Clear existing markers
        currentMarkers.forEach(m => map.removeLayer(m));
        currentMarkers = [];
        stationList.innerHTML = '';

        // Filter by pill state
        let filteredStations = currentStations;
        if (activePillFilter === 'open') {
            filteredStations = filteredStations.filter(s => s.is_open_now);
        } else if (activePillFilter === 'favorites') {
            filteredStations = filteredStations.filter(s => favoriteStations.includes(s.id));
        }

        stationCount.textContent = `${filteredStations.length} STATIONS FOUND`;

        if (filteredStations.length === 0) {
            stationList.innerHTML = '<div class="loading-state">No stations match your criteria.</div>';
            return;
        }

        const bounds = L.latLngBounds();

        filteredStations.forEach((station, index) => {
            // A. Add to Sidebar
            const card = document.createElement('div');
            card.className = 'station-card';
            if (index === 0) card.classList.add('closest'); // highlight first purely for visual demo

            let badgesHtml = '';
            station.fuel_types.forEach(fuel => {
                const isGreen = fuel.includes('AI-95') || fuel.includes('CNG');
                badgesHtml += `<span class="badge ${isGreen ? 'green' : ''}">${fuel}</span>`;
            });

            if (station.is_open_now && activePillFilter !== 'open') {
                badgesHtml += `<span class="badge green">OPEN</span>`;
            }

            const isFavorite = favoriteStations.includes(station.id);

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${station.name}</h3>
                    <div class="card-rating">
                        <span>★</span> ${station.rating.toFixed(1)}
                    </div>
                </div>
                <div class="card-address">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${station.address}, ${station.city}
                </div>
                <div class="badge-row">
                    ${badgesHtml}
                </div>
                <div class="card-actions">
                    <button class="btn-navigate" data-lat="${station.lat}" data-lng="${station.lng}">
                        <span>➤</span> Navigate
                    </button>
                    <button class="btn-icon btn-favorite ${isFavorite ? 'active' : ''}" data-station-id="${station.id}">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-navigate') && !e.target.closest('.btn-favorite')) {
                    map.flyTo([station.lat, station.lng], 15);
                    showClosestCard(station);
                }
            });

            const navigateBtn = card.querySelector('.btn-navigate');
            navigateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lat = parseFloat(e.currentTarget.dataset.lat);
                const lng = parseFloat(e.currentTarget.dataset.lng);

                if (!userMarker) {
                    alert("Please click 'Locate Me' first to get your starting position.");
                    return;
                }

                const startLat = userMarker.getLatLng().lat;
                const startLng = userMarker.getLatLng().lng;
                buildRoute(startLat, startLng, lat, lng);
            });

            const favoriteBtn = card.querySelector('.btn-favorite');
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(station.id, favoriteBtn);
            });

            stationList.appendChild(card);

            // B. Add to Map
            const marker = L.marker([station.lat, station.lng], {
                icon: stationIcon
            }).addTo(map);

            marker.on('click', () => {
                map.flyTo([station.lat, station.lng], 15);
                showClosestCard(station);

                // Scroll sidebar to card
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight
                document.querySelectorAll('.station-card').forEach(c => c.classList.remove('closest'));
                card.classList.add('closest');
            });

            currentMarkers.push(marker);
            bounds.extend([station.lat, station.lng]);
        });

        // Auto fit map if we have points and not zoomed in deeply
        if (currentMarkers.length > 0 && map.getZoom() < 14) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
    };

    const showClosestCard = (station) => {
        closestCard.classList.remove('hidden');
        closestName.textContent = station.name;

        // Update Description
        if (station.description) {
            closestDesc.textContent = station.description;
            closestDesc.style.display = 'block';
        } else {
            closestDesc.style.display = 'none';
        }

        // Update Time with icon
        if (station.open_time) {
            closestTime.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${station.open_time}
            `;
            closestTime.style.display = 'flex';
        } else {
            closestTime.style.display = 'none';
        }

        // Update Image
        if (station.image_url) {
            closestImgContainer.style.backgroundImage = `url('${station.image_url}')`;
        } else {
            closestImgContainer.style.backgroundImage = `url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpath d="M3 2v6h18V2H3zm13 14h-8v6h8v-6zm-7-2v2h6v-2h-6z"%3e%3c/path%3e%3c/svg%3e')`;
        }

        // Enhanced pricing based on fuel types
        let pricesHtml = '';
        const fuelPrices = {
            'PETROL AI-80': '8,500 UZS',
            'PETROL AI-92': '9,800 UZS',
            'PETROL AI-95': '10,500 UZS',
            'PETROL AI-98': '11,200 UZS',
            'DIESEL': '9,200 UZS',
            'CNG': '2,800 UZS',
            'LPG': '3,500 UZS'
        };

        station.fuel_types.slice(0, 3).forEach(fuelType => {
            const price = fuelPrices[fuelType] || 'Available';
            pricesHtml += `<div class="price-item"><span class="price-label">${fuelType}</span><span class="price-val">${price}</span></div>`;
        });

        if (!pricesHtml && station.fuel_types.length > 0) {
            pricesHtml += `<div class="price-item"><span class="price-label">${station.fuel_types[0]}</span><span class="price-val">Available</span></div>`;
        }

        closestPrices.innerHTML = pricesHtml;
    };

    // 5. Event Listeners
    searchInput.addEventListener('input', debounce(fetchStations, 300));
    regionFilter.addEventListener('change', fetchStations);
    fuelFilter.addEventListener('change', fetchStations);

    pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            pills.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            activePillFilter = e.target.dataset.filter;
            renderUI();
        });
    });

    locateMeBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.flyTo([lat, lng], 14);

                // Add or update User Marker
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                userMarker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: "#3b82f6",
                    color: "#ffffff",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 1
                }).bindPopup("You are here").addTo(map);

                // Sort stations by distance
                if (currentStations.length > 0) {
                    const sorted = [...currentStations].sort((a, b) => {
                        const distA = Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2);
                        const distB = Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2);
                        return distA - distB;
                    });
                    const nearest = sorted[0];
                    showClosestCard(nearest);

                    // Auto-build route to nearest station
                    buildRoute(lat, lng, nearest.lat, nearest.lng);
                }
            }, err => {
                alert("Could not access your location.");
            });
        }
    });

    // Build route helper function
    const buildRoute = (startLat, startLng, destLat, destLng) => {
        // Clear existing route if any
        if (routingControl) {
            map.removeControl(routingControl);
        }

        // Add Routing
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(startLat, startLng),
                L.latLng(destLat, destLng)
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{ color: '#00d936', opacity: 0.8, weight: 6 }]
            },
            createMarker: function () { return null; }
        }).addTo(map);
    };

    // Toggle favorite
    const toggleFavorite = (stationId, btn) => {
        const index = favoriteStations.indexOf(stationId);
        if (index > -1) {
            favoriteStations.splice(index, 1);
            btn.classList.remove('active');
            btn.querySelector('svg').setAttribute('fill', 'none');
        } else {
            favoriteStations.push(stationId);
            btn.classList.add('active');
            btn.querySelector('svg').setAttribute('fill', 'currentColor');
        }
        localStorage.setItem('favoriteStations', JSON.stringify(favoriteStations));
    };

    // Util
    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    // Init
    fetchStations();
});
