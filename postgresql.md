This formula has created a default database cluster with:
initdb --locale=en_US.UTF-8 -E UTF-8 /opt/homebrew/var/postgresql@14

To start postgresql@14 now and restart at login:
brew services start postgresql@14
Or, if you don't want/need a background service you can just run:
/opt/homebrew/opt/postgresql@14/bin/postgres -D /opt/homebrew/var/postgresql@14

Great! PostgreSQL 14 is now installed and initialized.

To start PostgreSQL as a background service (recommended):

To run it manually (foreground):

After starting the service, you can connect to PostgreSQL and create your user and database:

1 vulnerability
Once done, restart your Node.js server and it should connect successfully.
Let me know if you need help with any of these steps!

To view your database and tables in **pgAdmin**, follow these steps:

1. **Open pgAdmin** and log in.

2. **Add a new server:**

   - Right-click on "Servers" in the left sidebar and choose "Create" > "Server".
   - **General tab:**
     - Name: (e.g., `AI Recruiter`)
   - **Connection tab:**
     - Host: `localhost`
     - Port: `5432`
     - Username: `rag_admin`
     - Password: `your_secure_password`
     - Database: `recruiter_db` (or leave blank to see all databases)

3. **Save and connect.**

4. **Browse your database:**

   - Expand the server you just added.
   - Expand "Databases" > `recruiter_db` > "Schemas" > "public" > "Tables".
   - You’ll see all tables created by your backend.

5. **View table data:**
   - Right-click a table and select "View/Edit Data" > "All Rows" to see the contents.

**Summary:**  
You can now graphically explore your database, tables, and data using pgAdmin!  
Let me know if you need help with specific queries or table inspection.
