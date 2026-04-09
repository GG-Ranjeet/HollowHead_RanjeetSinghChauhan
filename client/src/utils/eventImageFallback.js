/**
 * Returns a reliable fallback image URL for a given event category.
 * Used as the `onError` src replacement on all event <img> tags.
 * All images are from Unsplash (stable, high-quality, free).
 */
const CATEGORY_IMAGES = {
  Fest:       'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', // crowd + lights
  Hackathon:  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80', // laptops + code
  Workshop:   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', // classroom / workshop
  Networking: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', // people meeting
  Concert:    'https://images.unsplash.com/photo-1501386761578-eaa54b4f2ad9?w=800&q=80', // concert stage
  Sports:     'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80', // sports
  Cultural:   'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80', // cultural event
  Tech:       'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // tech / circuit
  Other:      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', // generic event
};

const DEFAULT_IMAGE = CATEGORY_IMAGES.Other;

/**
 * Get the fallback image URL for a category.
 * @param {string} category - Event category string
 * @returns {string} - Unsplash image URL
 */
export function getCategoryImage(category) {
  if (!category) return DEFAULT_IMAGE;
  // Exact match first, then case-insensitive
  return (
    CATEGORY_IMAGES[category] ||
    CATEGORY_IMAGES[Object.keys(CATEGORY_IMAGES).find(
      k => k.toLowerCase() === category.toLowerCase()
    )] ||
    DEFAULT_IMAGE
  );
}

/**
 * onError handler for <img> tags — swaps to category fallback image.
 * Usage: <img src={event.image} onError={imgFallback(event.category)} />
 * @param {string} category
 * @returns {function} React onError event handler
 */
export function imgFallback(category) {
  const fallback = getCategoryImage(category);
  return (e) => {
    if (e.target.src !== fallback) {   // prevent infinite loop if fallback itself fails
      e.target.src = fallback;
    }
  };
}
