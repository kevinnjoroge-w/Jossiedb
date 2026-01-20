const inquirer = require('inquirer');
const db = require('./db');

const questions = [
  {
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: ['List Items', 'Add Item', 'Update Quantity', 'Exit']
  }
];

function listItems() {
  db.all(`SELECT items.id, items.name, items.quantity, categories.name as category
          FROM items
          LEFT JOIN categories ON items.category_id = categories.id`, (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.table(rows);
    }
    db.close();
  });
}

function addItem() {
  inquirer.prompt([
    { type: 'input', name: 'name', message: 'Item name:' },
    { type: 'input', name: 'description', message: 'Description:' },
    { type: 'input', name: 'category_id', message: 'Category ID:' },
    { type: 'input', name: 'supplier_id', message: 'Supplier ID:' },
    { type: 'input', name: 'quantity', message: 'Quantity:' },
    { type: 'input', name: 'price', message: 'Price:' },
    { type: 'input', name: 'location', message: 'Location:' }
  ]).then(answers => {
    db.run(`INSERT INTO items (name, description, category_id, supplier_id, quantity, price, location)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
           [answers.name, answers.description, answers.category_id, answers.supplier_id, answers.quantity, answers.price, answers.location],
           function(err) {
             if (err) {
               console.error(err.message);
             } else {
               console.log(`Added item: ${answers.name}`);
             }
             db.close();
           });
  });
}

function updateQuantity() {
  inquirer.prompt([
    { type: 'input', name: 'id', message: 'Item ID:' },
    { type: 'input', name: 'quantity', message: 'New quantity:' }
  ]).then(answers => {
    db.run(`UPDATE items SET quantity = ? WHERE id = ?`, [answers.quantity, answers.id], function(err) {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`Updated item ${answers.id} quantity to ${answers.quantity}`);
      }
      db.close();
    });
  });
}

function main() {
  inquirer.prompt(questions).then(answers => {
    switch (answers.action) {
      case 'List Items':
        listItems();
        break;
      case 'Add Item':
        addItem();
        break;
      case 'Update Quantity':
        updateQuantity();
        break;
      case 'Exit':
        db.close();
        break;
    }
  });
}

main();