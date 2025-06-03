import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia2h1eW5oNDEiLCJhIjoiY21iN2ZkdTZiMDQxcTJvbzg1OTZnM3Z2dyJ9.QCx5MTy3kujszdy6gWIx2A';

type LocationPR = {
    city: string;
    exercise_name: string;
    weight: number;
    reps: number;
    latitude: number;
    longitude: number;
    user_name: string;
};

type LocationData = {
    city: string;
    latitude: number;
    longitude: number;
};

type PRData = {
    exercise_name: string;
    weight: number;
    reps: number;
    locations: LocationData;
    user_name: string;
};

const MapView: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [prs, setPRs] = useState<LocationPR[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [exercises, setExercises] = useState<string[]>([]);
    const [visibleBounds, setVisibleBounds] = useState<mapboxgl.LngLatBounds | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [styleLoaded, setStyleLoaded] = useState(false);
    const prevPRsRef = useRef<LocationPR[]>([]);

    // Get user's location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Default to USA center if location access is denied
                    setUserLocation({ lat: 39.8283, lng: -98.5795 });
                }
            );
        } else {
            // Default to USA center if geolocation is not supported
            setUserLocation({ lat: 39.8283, lng: -98.5795 });
        }
    }, []);

    // Fetch available exercises
    useEffect(() => {
        const fetchExercises = async () => {
            const { data, error } = await supabase
                .from('location_prs')
                .select('exercise_name')
                .order('exercise_name');

            if (!error && data) {
                const uniqueExercises = Array.from(new Set(data.map(pr => pr.exercise_name)));
                setExercises(uniqueExercises);
                // Set the first exercise as default if available
                if (uniqueExercises.length > 0) {
                    setSelectedExercise(uniqueExercises[0]);
                }
            }
        };

        fetchExercises();
    }, []);

    useEffect(() => {
        const fetchPRs = async () => {
            if (!visibleBounds) return;

            const { data, error } = await supabase
                .from('location_prs')
                .select(`
                    exercise_name,
                    weight,
                    reps,
                    locations (
                        city,
                        latitude,
                        longitude
                    ),
                    users!location_prs_user_id_fkey1 (
                        email,
                        first_name,
                        last_name
                    )
                `)
                .order('weight', { ascending: false });

            if (error) {
                console.error('Error fetching PRs:', error);
                setError('Failed to load PRs');
            } else if (data) {
                // Group PRs by city and exercise to find the best record for each
                const cityExercisePRs = new Map<string, PRData>();
                
                data.forEach((pr: any) => {
                    // Check if the location is within the visible bounds
                    const isInBounds = visibleBounds.contains([
                        pr.locations.longitude,
                        pr.locations.latitude
                    ]);

                    // Check if the exercise matches the selected exercise
                    const isSelectedExercise = selectedExercise === 'all' || pr.exercise_name === selectedExercise;

                    if (isInBounds && isSelectedExercise) {
                        const key = `${pr.locations.city}-${pr.exercise_name}`;
                        const existingPR = cityExercisePRs.get(key);
                        
                        // Only keep the highest weight PR for each city-exercise combination
                        if (!existingPR || pr.weight > existingPR.weight) {
                            const userName = pr.users ? 
                                `${pr.users.first_name || ''} ${pr.users.last_name || ''}`.trim() || pr.users.email 
                                : 'Anonymous';
                                
                            cityExercisePRs.set(key, {
                                exercise_name: pr.exercise_name,
                                weight: pr.weight,
                                reps: pr.reps,
                                locations: pr.locations,
                                user_name: userName
                            });
                        }
                    }
                });

                const formattedPRs = Array.from(cityExercisePRs.values()).map(pr => ({
                    city: pr.locations.city,
                    exercise_name: pr.exercise_name,
                    weight: pr.weight,
                    reps: pr.reps,
                    latitude: pr.locations.latitude,
                    longitude: pr.locations.longitude,
                    user_name: pr.user_name
                }));

                setPRs(formattedPRs);
            }
            setLoading(false);
        };

        fetchPRs();
    }, [visibleBounds, selectedExercise]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || !userLocation) return;

        console.log('Initializing map with user location:', userLocation);

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [userLocation.lng, userLocation.lat],
            zoom: 12
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl());

        // Wait for map to load before adding markers
        map.current.on('load', () => {
            console.log('Map loaded event fired');
            setMapLoaded(true);
        });

        // Wait for style to load
        map.current.on('style.load', () => {
            console.log('Map style loaded');
            setStyleLoaded(true);
            
            // Add user location marker
            if (userMarkerRef.current) {
                userMarkerRef.current.remove();
            }
            
            userMarkerRef.current = new mapboxgl.Marker({ color: '#FF0000' })
                .setLngLat([userLocation.lng, userLocation.lat])
                .setPopup(new mapboxgl.Popup().setHTML('<h3>Your Location</h3>'))
                .addTo(map.current!);

            console.log('User location marker added');

            // Set initial bounds
            setVisibleBounds(map.current!.getBounds());
        });

        // Update visible bounds when map moves
        map.current.on('moveend', () => {
            if (map.current) {
                setVisibleBounds(map.current.getBounds());
            }
        });

        // Clean up on unmount
        return () => {
            markersRef.current.forEach(marker => marker.remove());
            if (userMarkerRef.current) {
                userMarkerRef.current.remove();
            }
            map.current?.remove();
        };
    }, [userLocation]);

    // Update markers when PRs change
    useEffect(() => {
        console.log('PR effect triggered:', { 
            mapExists: !!map.current, 
            mapLoaded, 
            styleLoaded,
            loading, 
            prsLength: prs.length
        });

        if (!map.current || !mapLoaded || !styleLoaded || loading) {
            console.log('Early return - conditions not met');
            return;
        }

        // Clear existing PR markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        if (prs.length === 0) {
            console.log('No PRs to display');
            return;
        }

        console.log('Adding markers for PRs:', prs);

        // Add markers for each PR
        prs.forEach(pr => {
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <h3>${pr.city}</h3>
                <p><strong>${pr.exercise_name}</strong></p>
                <p>${pr.weight} lbs × ${pr.reps} reps</p>
                <p>Record holder: ${pr.user_name}</p>
            `);

            const marker = new mapboxgl.Marker()
                .setLngLat([pr.longitude, pr.latitude])
                .setPopup(popup)
                .addTo(map.current!);
            
            markersRef.current.push(marker);
        });

        console.log('Total markers added:', markersRef.current.length);
    }, [prs, loading, mapLoaded, styleLoaded]);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            <div className="content-card">
                <h2 style={{ marginBottom: '16px' }}>City Records</h2>
                <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                    <div>
                        <label htmlFor="exercise" style={{ marginRight: '10px' }}>Exercise:</label>
                        <select 
                            id="exercise" 
                            value={selectedExercise} 
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            style={{ padding: '5px', borderRadius: '4px', minWidth: '200px' }}
                        >
                            {exercises.map(exercise => (
                                <option key={exercise} value={exercise}>{exercise}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {error ? (
                    <div style={{ color: '#e74c3c', padding: '20px' }}>
                        {error}
                    </div>
                ) : (
                    <div
                        ref={mapContainer}
                        style={{
                            width: '100%',
                            height: '600px',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MapView; 