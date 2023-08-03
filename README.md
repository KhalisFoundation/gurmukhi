# Gurmukhi Shabadkosh
An internal tool to allow content team members to perform CRUD operations on Shabadkosh database for storing data for Shabadavali project.

## Environment Variables
To run this project, you will need to add the following environment variables to your .env file.

The following variables are required to connect Firestore database and Firebase Authentication :

`REACT_APP_API_KEY`,
`REACT_APP_AUTH_DOMAIN`,
`REACT_APP_PROJECT_ID`,
`REACT_APP_STORAGE_BUCKET`,
`REACT_APP_MESSAGING_SENDER_ID`,
`REACT_APP_APP_ID`

To obtain these variables, you will need to create a Firebase project and create a web app within it. Firebase then automatically displays these variables to be used in .env
Otherwise, you can find these variables in the project settings.

# Getting Started

Clone the repository

```bash
git clone https://github.com/KhalisFoundation/gurmukhi.git

# or the following if using github cli
gh repo clone KhalisFoundation/gurmukhi
```

Install dependencies
```
cd gurmukhi/shabadkosh
yarn install
```

Run the app
```
yarn start
```

App runs locally on http://localhost:3000

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Contribution
[Slack](https://khalis.slack.com) channel.

Before raising a pull request, please go through CONTRIBUTING.md.
We use branches created from issues for any changes, while main is the production branch. You should create an issue for any requested change(s) and branch out using create branch from issue feature, which automatically links it to respective issue when a PR is opened.
You can see your submitted changes on its own URL which is created with every new PR.
