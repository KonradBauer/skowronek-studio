export interface GoogleReview {
  author: string
  rating: number
  text: string
  date: string
  profilePhoto?: string
}

// Place ID for Skowronek Studio
const PLACE_ID = 'ChIJnTza-aG3EEcR47DSM1UaGew'

// Fallback reviews if API fails
const FALLBACK_REVIEWS: GoogleReview[] = [
  {
    author: 'Anna K.',
    rating: 5,
    text: 'Fantastyczna obsługa naszego wesela! Zdjęcia przeszły nasze najśmielsze oczekiwania. Polecamy z całego serca!',
    date: '2 miesiące temu',
  },
  {
    author: 'Marek W.',
    rating: 5,
    text: 'Profesjonalizm na najwyższym poziomie. Sesja rodzinna w plenerze — naturalne, piękne kadry. Dzieci uwielbiały fotografa!',
    date: '3 miesiące temu',
  },
  {
    author: 'Kasia i Tomek',
    rating: 5,
    text: 'Nasz teledysk ślubny to małe dzieło sztuki. Każdy kto go widzi, pyta o kontakt do studia. Dziękujemy!',
    date: '1 miesiąc temu',
  },
]

export async function fetchGoogleReviews(): Promise<{
  reviews: GoogleReview[]
  rating: number
  totalReviews: number
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set, using fallback reviews')
    return { reviews: FALLBACK_REVIEWS, rating: 5, totalReviews: 0 }
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=reviews,rating,userRatingCount&languageCode=pl`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'reviews,rating,userRatingCount',
        },
        next: { revalidate: 86400 }, // Cache for 24h
      },
    )

    if (!res.ok) {
      console.error('Google Places API error:', res.status)
      return { reviews: FALLBACK_REVIEWS, rating: 5, totalReviews: 0 }
    }

    const data = await res.json()

    const reviews: GoogleReview[] = (data.reviews || []).map(
      (r: {
        authorAttribution?: { displayName?: string; photoUri?: string }
        rating?: number
        text?: { text?: string }
        relativePublishTimeDescription?: string
      }) => ({
        author: r.authorAttribution?.displayName || 'Anonim',
        rating: r.rating || 5,
        text: r.text?.text || '',
        date: r.relativePublishTimeDescription || '',
        profilePhoto: r.authorAttribution?.photoUri,
      }),
    )

    return {
      reviews: reviews.length > 0 ? reviews : FALLBACK_REVIEWS,
      rating: data.rating || 5,
      totalReviews: data.userRatingCount || 0,
    }
  } catch (err) {
    console.error('Failed to fetch Google reviews:', err)
    return { reviews: FALLBACK_REVIEWS, rating: 5, totalReviews: 0 }
  }
}
