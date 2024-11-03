export const questions = [
    {
      id: 'plantType',
      text: "What type of plant are you growing? (e.g., Pine Tree, Oak, Grass Field)",
      validate: (value) => {
        if (value.length < 3) {
          return { isValid: false, error: "Plant type must be at least 3 characters long" };
        }
        return { isValid: true, value };
      }
    },
    {
      id: 'size',
      text: "What's the size of your project? (small/medium/large)",
      validate: (value) => {
        const size = value.toLowerCase();
        if (!['small', 'medium', 'large'].includes(size)) {
          return { isValid: false, error: "Please enter: small, medium, or large" };
        }
        return { isValid: true, value: size };
      }
    },
    {
      id: 'authorName',
      text: "What's your name or the project's author name?",
      validate: (value) => {
        if (value.length < 2) {
          return { isValid: false, error: "Name must be at least 2 characters long" };
        }
        return { isValid: true, value };
      }
    },
    {
      id: 'bio',
      text: "Give a short bio for your project (max 80 characters)",
      validate: (value) => {
        if (value.length > 80) {
          return { isValid: false, error: "Bio must be 80 characters or less" };
        }
        return { isValid: true, value };
      }
    },
    {
      id: 'coordinates',
      text: "Where is your project located? Share coordinates (e.g., 39.7392,-104.9903)",
      validate: (value) => {
        try {
          const [lat, lng] = value.split(',').map(n => parseFloat(n.trim()));
          if (isNaN(lat) || isNaN(lng)) throw new Error();
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return { isValid: false, error: "Coordinates out of valid range" };
          }
          return { isValid: true, value: { lat, lng } };
        } catch {
          return { isValid: false, error: "Invalid coordinates. Use format: lat,lng (e.g., 39.7392,-104.9903)" };
        }
      }
    },
    {
      id: 'thumbnailUri',
      text: "Share a thumbnail URL for your project",
      validate: (value) => {
        if (!value.startsWith('http')) {
          return { isValid: false, error: "Please provide a valid URL starting with http" };
        }
        return { isValid: true, value };
      }
    }
  ];
  
  export const initialReportData = {
    plantType: '',
    size: '',
    authorName: '',
    bio: '',
    thumbnailUri: '',
    lat: 0,
    lng: 0
  };