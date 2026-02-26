# fakebiz

A fullstack software for a fake company that has an inventory system, employee records, tracks orders, and much more

#1 Clone the repository
#2 Open the cloned repository in terminal
#3 run "docker compose up" (make sure docker is running)
#4 Open your browser and go to localhost:8000/docs to view the backend
#5 Open your browser and go to localhost:8080/docs to view the frontend
#6 To exit press CTRL + C in the terminal
#7 Run "docker compose down"

PS. You can enter your own data, but if you don't want to then I have created a seed script
which will feed some pre generated data to the database. Just open another terminal in the repo
folder and run-> docker compose exec db psql -U minibiz -d minibiz -f /seed.sql
