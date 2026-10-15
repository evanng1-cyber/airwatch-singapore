# Airwatch Singapore

A live overview of the 24-hour PSI and one-hour PM₂.₅ across Singapore's North,
South, East, West, and Central regions. Regional cards also include 24-hour PM₁₀.

## Start the website

1. Optionally add your data.gov.sg API key to `.env.local` in the project root:

   ```env
   DATA_GOV_SG_API_KEY=your-data-gov-sg-api-key
   ```

   Live PSI readings work without a key. If provided, `.env.local` is excluded
   from Git, and the key stays on the local server rather than a visitor's
   browser.

2. Start the built-in Node.js server:

   ```sh
   node server.js
   ```

3. Open [http://localhost:4173](http://localhost:4173).

The dashboard refreshes automatically every five minutes. To refresh sooner,
use the Refresh button. If no date is provided, the server requests the current
date in Singapore time from the data.gov.sg v2 PSI and PM₂.₅ APIs.

## Deploy on Render

The included `render.yaml` is a Render Blueprint for the existing Node.js
server. Push this project to a private GitHub repository, connect that
repository in Render, and create a new Blueprint Instance. Render will provide
a stable `onrender.com` URL. Its free web service may sleep after inactivity;
the first visit after sleep can take a little longer while it starts up.