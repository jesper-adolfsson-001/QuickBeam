// log-service.js
const { Client } = require('pg')


// --- Define Action Constants ---
// Makes calling the logger consistent and less prone to typos
const Actions = {
    VIEW_RECEIVER: "VIEW_RECEIVER_PAGE",
    VIEW_SENDER: "VIEW_SENDER_PAGE",
    UPLOAD_IMAGE: "UPLOAD_IMAGE",
    DOWNLOAD_IMAGE: "DOWNLOAD_IMAGE",
    SESSION_CREATED: "SESSION_CREATED", // Optional: Log session start
    SESSION_CONNECTED: "SESSION_CONNECTED", // Optional: Log sender connect
    SESSION_CLEANUP: "SESSION_CLEANUP", // Optional: Log session end
};


async function queryDatabase_counter() {
  const databaseUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const result = await client.query('SELECT value FROM quickbeam_counter WHERE id = 1;');

    if (result.rows.length > 0) {
      return result.rows[0].value; // return just the integer
    } else {
      console.error("Counter row not found");
      return -1;
    }

  } catch (error) {
    console.error("Database query error:", error);
    return -1;

  } finally {
    await client.end();
  }
}

async function incrementCounter() {
  const databaseUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Increment and return the updated value
    const result = await client.query(
      `UPDATE quickbeam_counter 
       SET value = value + 1 
       WHERE id = 1 
       RETURNING value;`
    );

    if (result.rows.length > 0) {
      return result.rows[0].value;
    } else {
      console.error("Counter row not found during increment");
      return -1;
    }

  } catch (error) {
    console.error("Database increment error:", error);
    return -1;

  } finally {
    await client.end();
  }
}


/**
 * Logs an event to the database.
 * @param {string} ip - The client's IP address.
 * @param {string | null} sessionId - The session ID, if applicable.
 * @param {string} action - The action performed (use Actions constants).
 * @param {object | null} details - Optional additional details (e.g., { fileSize: 12345, imageId: 'xyz' }).
 * Needs better handling so it only returns the rows needed, to be fixed !!!
 */
async function logEvent(ip, sessionId, action, details = null) {
  const databaseUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: databaseUrl });

  const timestamp = new Date().toISOString();

  try {
    await client.connect();

    const query = `
      INSERT INTO quickbeam_eventlog (timestamp, ip, session_id, action, details)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(query, [
      timestamp,
      ip || "unknown",
      sessionId || null,
      action,
      details ? JSON.stringify(details) : null
    ]);

  } catch (error) {
    console.error("[Log Service Error] Failed to write to database:", error);
    console.error("[Log Service Error] Original log entry:", {
      timestamp,
      ip: ip || "unknown",
      sessionId: sessionId || null,
      action,
      details
    });

  } finally {
    await client.end();
  }
}


async function getLogData() {
  const databaseUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Fetch all logs (you’ll optimize filtering/paging later)
    const result = await client.query(`
      SELECT timestamp, ip, session_id, action, details
      FROM quickbeam_eventlog
      ORDER BY id ASC
    `);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "No logs found",
      };
    }

    // Format logs into newline-delimited JSON (like your file format)
    const data = result.rows
      .map(row => JSON.stringify(row))
      .join("\n");

    return { success: true, data };

  } catch (error) {
    return {
      success: false,
      error: "Error reading logs from database",
      details: error.message,
    };

  } finally {
    await client.end();
  }
}

// --- Photo Counter Functions ---

/**
 * Increments the photo count stored in the persistent file.
 * Reads the current count, adds 1, and writes the new value back.
 * Creates the file if it doesn't exist.
 * @returns {Promise<number | null>} The *new* photo count after incrementing, or null if writing failed.
 */
async function photoUploaded() {

    try {
      const newVal = await incrementCounter();

      if (newVal === -1) {
        console.error("Error: Could not update counter");
      } else {
        console.log("Counter updated to:", newVal);
        return newVal;
      }

    } catch (err) {
      console.error("Unexpected error while updating counter:", err);
      return null; // Indicate failure
    }
}

/**
 * Retrieves the current photo count without modifying it.
 * Useful for displaying the count or using it elsewhere.
 * @returns {Promise<number>} The current photo count.
 */
async function getPhotoCount() {
    // Simply read the current count using the helper function
    // const count = await readCurrentCount();
    const count = await queryDatabase_counter();
    return count;
}

// Export the function and constants for use in server.js
module.exports = {
    logEvent,
    getLogData,
    Actions,
    photoUploaded, // <-- Export the new function
    getPhotoCount, // <-- Export the new function
};

console.log(`[Log Service] Initialized. Logging events to database: ${process.env.DATABASE_URL}`);
