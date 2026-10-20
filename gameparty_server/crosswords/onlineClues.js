// server/crosswords/onlineClues.js
/**
 * Servicio de Pistas Online desde Internet (Wikipedia REST API)
 * Obtiene definiciones claras, concisas y fotografías reales para crucigramas en tiempo real.
 */

// Caché en memoria para respuestas instantáneas
const clueCache = new Map();

// Quitar spoiler de la palabra dentro de su propia pista
function sanitizeClue(clueText, targetWord) {
  if (!clueText || typeof clueText !== "string") return "";
  
  let cleaned = clueText.trim();
  
  // Si la definición empieza con "El [palabra] es..." o "La [palabra] es...", recortar el inicio
  const regexStart = new RegExp(`^(el|la|los|las|un|una|se denomina|se llama|es un|es una)\\s+${targetWord}\\s+(es\\s+|fue\\s+|era\\s+|son\\s+)?`, "i");
  cleaned = cleaned.replace(regexStart, "");

  // Reemplazar ocurrencias de la palabra clave si aún aparecen
  const regexWord = new RegExp(`\\b${targetWord}\\b`, "gi");
  cleaned = cleaned.replace(regexWord, "...");

  // Capitalizar primera letra
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    // Asegurar que termine en punto
    if (!cleaned.endsWith(".") && !cleaned.endsWith("...")) {
      cleaned += ".";
    }
  }

  return cleaned;
}

/**
 * Consulta la API de Wikipedia en español para un término.
 */
async function fetchOnlineClue(word, fallbackClue = "", fallbackImage = "") {
  const normalizedKey = word.toLowerCase().trim();

  // 1. Revisar caché
  if (clueCache.has(normalizedKey)) {
    const cached = clueCache.get(normalizedKey);
    return {
      clue: cached.clue || fallbackClue,
      image: cached.image || fallbackImage,
      source: cached.source || "cache"
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GamePartyWeb/1.0 (https://github.com/Xblade23-4/gameparty-web; info@gameparty.dev)",
        "Accept": "application/json"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Si la búsqueda directa da 404, guardar fallback en caché
      const res = { clue: fallbackClue, image: fallbackImage, source: "fallback-not-found" };
      clueCache.set(normalizedKey, res);
      return res;
    }

    const data = await response.json();

    let onlineClue = "";
    let onlineImage = data.thumbnail?.source || fallbackImage;

    // A. Evaluar si la 'description' de Wikipedia es una pista concisa válida
    const desc = data.description ? data.description.trim() : "";
    const isDisambiguation = desc.toLowerCase().includes("desambiguación") || 
                             (data.extract && data.extract.toLowerCase().includes("puede referirse a"));

    if (desc && !isDisambiguation && desc.length >= 8 && !desc.toLowerCase().startsWith("página de")) {
      onlineClue = desc.charAt(0).toUpperCase() + desc.slice(1);
      if (!onlineClue.endsWith(".")) onlineClue += ".";
    } else if (data.extract && !isDisambiguation) {
      // B. Si la descripción no es suficiente, tomar la primera oración del resumen
      const firstSentence = data.extract.split(/\.\s+/)[0];
      if (firstSentence && firstSentence.length >= 10 && firstSentence.length <= 160) {
        onlineClue = sanitizeClue(firstSentence, word);
      }
    }

    // C. Si la pista online es muy corta o vaga, preferir fallback local
    if (!onlineClue || onlineClue.length < 10 || /^(especie de planta|especie de ave|mamífero)\.?$/i.test(onlineClue)) {
      onlineClue = fallbackClue || onlineClue;
    }

    const result = {
      clue: onlineClue || fallbackClue,
      image: onlineImage,
      source: "wikipedia"
    };

    clueCache.set(normalizedKey, result);
    return result;

  } catch (error) {
    // Si falla o excede el tiempo límite (timeout), usar fallback local
    const fallbackRes = { clue: fallbackClue, image: fallbackImage, source: "fallback-offline" };
    clueCache.set(normalizedKey, fallbackRes);
    return fallbackRes;
  }
}

/**
 * Enriquece una lista de palabras seleccionadas con pistas e imágenes en paralelo.
 */
async function enrichWordsWithOnlineClues(placedWords) {
  if (!Array.isArray(placedWords) || placedWords.length === 0) return placedWords;

  const enrichmentPromises = placedWords.map(async (item) => {
    const wordToLookup = item.displayWord || item.word;
    const onlineData = await fetchOnlineClue(wordToLookup, item.clue, item.image);

    return {
      ...item,
      clue: onlineData.clue || item.clue,
      image: onlineData.image || item.image || "",
      clueSource: onlineData.source
    };
  });

  const results = await Promise.allSettled(enrichmentPromises);

  return results.map((res, index) => {
    if (res.status === "fulfilled") {
      return res.value;
    }
    return placedWords[index];
  });
}

module.exports = {
  fetchOnlineClue,
  enrichWordsWithOnlineClues
};
