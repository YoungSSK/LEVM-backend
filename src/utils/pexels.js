import axios from "axios";

export const getImageByWord = async (word) => {
  try {
    const response = await axios.get("https://api.pexels.com/v1/search", {
      params: {
        query: word,
        per_page: 1,
      },
      headers: {
        Authorization: process.env.PEXELS_API_KEY,
      },
    });

    const photo = response.data.photos?.[0];

    return photo
      ? {
          imageUrl: photo.src.large,
          photographer: photo.photographer,
        }
      : null;
  } catch (error) {
    console.error("Pexels API Error:", error.message);
    return null;
  }
};
