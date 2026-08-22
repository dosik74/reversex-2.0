const STEAM_API_KEY = '8A9FA5718D266AD5379FB7F726B1B3F5';
const STEAM_CACHE = new Map<number, string>();

interface SteamAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  short_description: string;
  detailed_description: string;
  about_the_game: string;
  [key: string]: any;
}

// Get Steam app ID from game name using RAWG store data
export const getSteamAppIdFromRAWG = async (gameId: number): Promise<number | null> => {
  try {
    const apiKey = "c33c648c0d8f45c494af8da025d7b862";
    const response = await fetch(
      `https://api.rawg.io/api/games/${gameId}?key=${apiKey}`
    );
    const data = await response.json();

    if (data.stores && Array.isArray(data.stores)) {
      const steamStore = data.stores.find((s: any) => s.store?.name?.toLowerCase() === 'steam');
      if (steamStore?.url_en) {
        const match = steamStore.url_en.match(/\/app\/(\d+)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting Steam ID from RAWG for game ${gameId}:`, error);
    return null;
  }
};

// Get Russian description from Steam using Steam Web API
export const getSteamDescription = async (steamAppId: number): Promise<string | null> => {
  if (STEAM_CACHE.has(steamAppId)) {
    return STEAM_CACHE.get(steamAppId) || null;
  }

  try {
    // Use Steam Community API with Russian language
    const response = await fetch(
      `https://steamcommunity.com/api/appdetails?appids=${steamAppId}&l=russian`
    );
    const data = await response.json();

    if (data[steamAppId]?.success) {
      const appDetails = data[steamAppId].data as SteamAppDetails;
      const description = appDetails.detailed_description || 
                         appDetails.about_the_game || 
                         appDetails.short_description || 
                         '';

      if (description) {
        STEAM_CACHE.set(steamAppId, description);
        console.log(`Got Steam description for app ${steamAppId}`);
        return description;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Steam description for app ${steamAppId}:`, error);
    return null;
  }
};

// Main function to get game description from Steam (if available)
export const getGameDescriptionFromSteam = async (gameId: number): Promise<string | null> => {
  try {
    // First, get Steam app ID from RAWG
    const steamAppId = await getSteamAppIdFromRAWG(gameId);
    if (!steamAppId) {
      console.log(`No Steam ID found for game ${gameId}`);
      return null;
    }

    // Then get description from Steam
    const description = await getSteamDescription(steamAppId);
    return description;
  } catch (error) {
    console.error(`Error getting Steam description for game ${gameId}:`, error);
    return null;
  }
};
