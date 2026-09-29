import { app } from "./app.js";
import { connectDatabase, env } from "./config/index.js";
connectDatabase()
  .then(() =>
    app.listen(env.port, () =>
      console.log(`API running at http://localhost:${env.port}`),
    ),
  )
  .catch((e) => {
    console.error("Database connection failed", e);
    process.exit(1);
  });
