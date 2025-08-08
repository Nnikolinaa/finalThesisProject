import { ref, onMounted } from 'vue';
import { MainService } from '@/services/mainService';
import { AuthService } from '@/services/authService';
import type { Vehicle } from '@/models/vehicle.model';

// Import images
import lamborghiniImage from '@/assets/lamborghini.jpg';
import rollsRoyceImage from '@/assets/rolls-royce.jpg';
import ferrariImage from '@/assets/ferrari.jpg';
import porsche911Image from '@/assets/porshe911TurboS.jpg';
import mclaren720sImage from '@/assets/mclaren720s.jpg';
import audiR8Image from '@/assets/audiR8v10.jpg';
import bentleyBentayga from '@/assets/bentleyBentayga.jpg';
import bentlyContinentalGT from '@/assets/bentlyContinentalGT.jpg';
import bmwM8Image from '@/assets/bmwM8.jpg';
import buggatiChironSuperSport from '@/assets/buggatiChironSuperSport.jpg';
import jaguarFytpe from '@/assets/jaguarFtpe.jpg';
import lexusLC500 from '@/assets/lexusLC500.jpg';
import maseratiGranTurismo from '@/assets/masseratiGranTurismo.jpg';
import maseratiLevante from '@/assets/masseratiLevante.jpg';
import rollsRoyceCullinan from '@/assets/rollsRoyceCullinan.jpg';
import porshePanamera from '@/assets/porshePanamera.jpg';
import nissanGTRNismo from '@/assets/nissanGT-R-Nismo.jpg';
import astonMartinDBSImage from '@/assets/astonMartinDBS.jpg';
import rangeRoverAutobiography from '@/assets/rangeRoverAutobiography.jpg';
import MercedesAMGGTR from '@/assets/mercedesAMGGTR.jpg';
import fallbackImage from '@/assets/mercedesAMGGTR.jpg'; // Add a fallback image

const vehicles = ref<Vehicle[]>([]);

// Map image paths to imported images
const imageMap: Record<string, string> = {
  'lamborghini.jpg': lamborghiniImage,
  'rolls-royce.jpg': rollsRoyceImage,
  'ferrari.jpg': ferrariImage,
  'porshe911TurboS.jpg': porsche911Image,
  'mclaren720s.jpg': mclaren720sImage,
  'audiR8v10.jpg': audiR8Image,
  'bentleyBentayga.jpg': bentleyBentayga,
  'bentlyContinentalGT.jpg': bentlyContinentalGT,
  'bmwM8.jpg': bmwM8Image,
  'buggatiChironSuperSport.jpg': buggatiChironSuperSport,
  'jaguarFtpe.jpg': jaguarFytpe,
  'lexusLC500.jpg': lexusLC500,
  'masseratiGranTurismo.jpg': maseratiGranTurismo,
  'masseratiLevante.jpg': maseratiLevante,
  'rollsRoyceCullinan.jpg': rollsRoyceCullinan,
  'porshePanamera.jpg': porshePanamera,
  'nissanGT-R-Nismo.jpg': nissanGTRNismo,
  'astonMartinDBS.jpg': astonMartinDBSImage,
  'rangeRoverAutobiography.jpg': rangeRoverAutobiography,
  'mercedesAMGGTR.jpg': MercedesAMGGTR,
};

// Normalize the keys in the imageMap
const normalizedImageMap: Record<string, string> = Object.fromEntries(
  Object.entries(imageMap).map(([key, value]) => [key.toLowerCase(), value])
);

const fetchVehicles = async () => {
  try {
        const response = await MainService.useAxios<Vehicle[]>('/vehicles', 'get', {}, false); 
    vehicles.value = response.data.map((vehicle) => ({
      ...vehicle,
      imagePath: normalizedImageMap[vehicle.imagePath.toLowerCase()] || fallbackImage, // Use normalized keys
      price: `$${parseInt(vehicle.price).toLocaleString()}/day`, // Format price
    }));
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
  }
};

const fetchVehicleById = async (id: number): Promise<Vehicle | null> => {
  try {
    const response = await MainService.useAxios<Vehicle>(`/vehicles/${id}`);
    const vehicle = response.data;
    return {
      ...vehicle,
      imagePath: imageMap[vehicle.imagePath] || fallbackImage, // Use fallback image if no match is found
      price: `$${parseInt(vehicle.price).toLocaleString()}/day`, // Format price
    };
  } catch (error) {
    console.error(`Failed to fetch vehicle with ID ${id}:`, error);
    return null;
  }
};

onMounted(fetchVehicles);

export const useVehicleService = () => {
  return { vehicles, fetchVehicles, fetchVehicleById, imageMap };
};
