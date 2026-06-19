import axios from "axios";
const getEmptyWordInfo = () => ({
  pronunciations: {
    us: "",
    uk: "",
  },

  audioUrls: {
    us: "",
    uk: "",
  },
});
export const getWordInfo = async (word) => {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word,
      )}`,
    );

    const data = response.data?.[0];

    if (!data) {
      return getEmptyWordInfo();
    }

    const phonetics = data.phonetics || [];

    // Tìm bản ghi US
    const usPhonetic = phonetics.find(
      (item) => item.audio && item.audio.toLowerCase().includes("-us.mp3"),
    );

    // Tìm bản ghi UK
    const ukPhonetic = phonetics.find(
      (item) => item.audio && item.audio.toLowerCase().includes("-uk.mp3"),
    );

    // Fallback nếu không tìm thấy US/UK
    const firstPhonetic =
      phonetics.find((item) => item.text || item.audio) || {};

    return {
      pronunciations: {
        us: usPhonetic?.text || firstPhonetic.text || "",

        uk: ukPhonetic?.text || firstPhonetic.text || "",
      },

      audioUrls: {
        us: usPhonetic?.audio || firstPhonetic.audio || "",

        uk: ukPhonetic?.audio || firstPhonetic.audio || "",
      },
    };
  } catch (error) {
    console.error(`Dictionary API Error (${word}):`, error.message);

    return getEmptyWordInfo();
  }
};
