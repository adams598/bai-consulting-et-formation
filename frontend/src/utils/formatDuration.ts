export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else if (seconds < 86400) { // < 24h
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  } else if (seconds < 604800) { // < 7 jours
    const days = Math.floor(seconds / 86400);
    return `${days}j`;
  } else {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks}w`;
  }
};

export const formatDurationFromSeconds = (seconds: number): string => {
  return formatDuration(seconds);
};

// Function to parse ISO 8601 duration (e.g., "PT1H30M") to seconds
export const parseISODuration = (isoDuration: string): number => {
  const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;

  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

  return hours * 3600 + minutes * 60 + seconds;
};

// Function to convert seconds to ISO 8601 duration format (e.g., "PT1H30M")
export const toISODuration = (seconds: number): string => {
  if (seconds <= 0) return "PT0S";
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsFinal = remainingSeconds % 60;
  
  let iso = "PT";
  if (hours > 0) {
    iso += `${hours}H`;
  }
  if (minutes > 0) {
    iso += `${minutes}M`;
  }
  if (remainingSecondsFinal > 0 || (hours === 0 && minutes === 0)) {
    iso += `${remainingSecondsFinal}S`;
  }
  return iso;
};
