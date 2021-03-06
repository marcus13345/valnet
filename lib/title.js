const formPhrase = require("font-ascii").default;
const { strlen, ansiEscapeCodes} = require ('printable-characters');
const chalk = require('chalk').default;
const gradient = require('gradient-string');
const tty = require('tty').isatty(process.stdout.fd)

module.exports.title = function(component, cls = true) {

  if(cls) {
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();
  }
  const bigDisplay = !tty ? false : process.stdout.getWindowSize()[1] > 45
  if(bigDisplay) console.log();

// 	centerString(`
//                  /\\          .-.      .-.              .-.-.;;;;;;' 
// .;.       .-._  / |        ;' (_)       ;  :   .;;;.\`-' (_)  .;     
//  \`;     .'  (  /  |  .   .:'          .;:  :  ;;  (_)        :      
//   ;;  .'     \`/.__|_.'  .:'          .;' \\ :  .;;; .-.     .:'      
//  ;;  ;   .:' /    |   .-:.    .-..:'.;    \\: ;;  .;  ;   .-:._      
//  \`;.'   (__.'     \`-'(_/ \`;._.  (__.'      \`.\`;.___.'   (_/  \`-     
// 	`);

	centerString(`
               /\\         .-.       .-.             .-.--------' 
.-.     .-._  / |        / (_)        /  |  .---;\`-' (_)   /     
   )   /  (  /  |  .    /            /\\  | (   (_)        /      
  /   /    \`/.__|_.'   /            /  \\ |  )--          /       
 (  .' .:' /    |   .-/.    .-..-' /    \\| (      /   .-/._      
  \\/  (__.'     \`-'(_/ \`-._.  (__.'      \`.\`\\___.'   (_/   \`-     `);

	if(bigDisplay) centerString(`
            ______________________
           /\\  __________________ \\
          //\\\\ \\________________/\\ \\
         ///\\\\\\ \\            ///\\\\\\ \\
        /// /\\\\\\ \\          /// /\\\\\\ \\
       /// /  \\\\\\ \\________/_/_/__\\_\\ \\____________________
      /// /    \\\\\\____________________  __________________ \\
     /// /     /// __________________/\\ \\________________/\\ \\
    /// /_____/// /_____/// /_____///\\\\\\ \\____        ///\\\\\\ \\
   ///_/_____/// /______\\/_/_____/// /\\\\\\ \\__ \\      /// /\\\\\\ \\
   \\\\\\ \\____/// /_______/\\ \\____/// /__\\\\\\ \\/\\ \\____/_/_/__\\_\\ \\
    \\\\\\ \\  /// /     ///\\\\\\ \\  /// /    \\\\\\_____________________\\ 
     \\\\\\ \\/// /     /// /\\\\\\_\\/// /     /// __________________  /
      \\\\\\/// /_____/_/_/__\\_\\///_/_____/// /__\\_\\///_/     /// /
       \\\\//_/________________\\/_/_____/// /______\\/_/     /// /
       //\\\\ \\________________/\\ \\____/// /______ /\\ \\    /// /
      ///\\\\\\ \\  /// /_____///\\\\\\ \\__/// /     ///\\\\\\ \\  /// /
     /// /\\\\\\ \\///_/_____/// /\\\\\\ \\/// /     /// /\\\\\\ \\/// /
    /// /  \\\\\\ \\_\\_\\____/_/_/__\\_\\/// /\\____/_/_/__\\_\\/// /
   /// /    \\\\\\___________________\\/ /________________\\/ /
  /// /     /// __________________  ____________________/
 /// /_____/// /__\\_\\/// /_____/// /__\\_\\/// /
///_/_____/// /______\\/_/_____/// /______\\/ /
\\\\\\ \\____/// /_______/\\ \\____/// /_________/
 \\\\\\ \\  /// /        \\\\\\ \\  /// /
  \\\\\\ \\/// /          \\\\\\ \\/// /
   \\\\\\/// /____________\\_\\/// /
    \\\\// /________________\\/ /
     \\/_____________________/`);

	console.log();
	if(bigDisplay) console.log();

	centerString(formPhrase(component, {
    typeface: 'Small',
    color: 'white',
		silent: true
	}));
}




function centerString(string, options = {}) {

  if(!tty) return console.log(string);

	const windowWidth = process.stdout.getWindowSize()[0];

	const text = string.replace(ansiEscapeCodes, '').split('\n');

	const textWidth = Math.max.apply(this, text.map(v => strlen(v)));

	const padding = ' '.repeat(Math.floor((windowWidth - textWidth) / 2));

	for(const line of 
		gradient.pastel.multiline(text.join('\n')).split('\n')
	) {
		console.log(padding + line);
	}
}