# Share a Ride Mobile

This is a React Native mobile application for Share a Ride, converted from the React web application.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Supabase Configuration**:
    Open `src/lib/supabase.ts` and replace the placeholders with your Supabase URL and Anonymous Key.
    ```typescript
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    ```

3.  **Run the App**:
    ```bash
    npx expo start
    ```

## Features

-   **Authentication**: Login and Sign Up.
-   **Home**: View your rides and available rides.
-   **Create Ride**: Offer or request a ride.
-   **Find Matches**: Find matching rides for your request.
-   **My Matches**: Manage incoming match requests (Accept/Decline).

## Limitations

-   **Geocoding**: The map integration and address autocomplete are placeholders. You need to implement a geocoding service (e.g., Google Maps API) for real-world usage.
-   **Chat**: The chat feature is not yet implemented.
-   **Profile**: Profile setup is simplified.
