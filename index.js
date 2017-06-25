import inquirer from 'inquirer';
import find_groups from './lib/find_groups';
import connecter from './lib/connecter';

/**
 * [questions array for inquirer]
 * @type {Array}
 */
let questions = [
  {
    type: 'password',
    name: 'auth_token',
    message: 'What is your GroupMe token?',
    validate: (input) => {
      return input.length >= 40 ? true : 'Tokens should be at least 40 characters.'
    }
  }
];

/**
 * Inquirer instantiation
 */
inquirer.prompt(questions,
  function ({auth_token}) {
    find_groups(auth_token).then(function (group_ids) {
      for (let i = 0; i < group_ids.length; i++) {
        let group_id = group_ids[i];
        console.log("Download gallery for group_id: " + group_id);
        connecter(auth_token, group_id);
      }
    }).catch(function (error) {
       console.log(error.message);
    });
  }
);
