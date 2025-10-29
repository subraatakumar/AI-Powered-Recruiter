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
