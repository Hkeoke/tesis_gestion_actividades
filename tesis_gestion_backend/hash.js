    const bcrypt = require('bcrypt');

    // La contraseña que quieres hashear para tu administrador
    const plainPassword = 'admin'; // ¡Cámbiala por una contraseña real y fuerte!

    // El "costo" del hashing (salt rounds). Un valor más alto es más seguro pero más lento.
    // 10 o 12 es un buen punto de partida.
    const saltRounds = 10;

    console.log(`Generando hash para la contraseña: "${plainPassword}"`);

    // bcrypt.hash es asíncrono (usa un callback o Promises)
    bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
      if (err) {
        console.error('Error al generar el hash:', err);
        return;
      }

      console.log('----------------------------------------------------');
      console.log('¡Hash generado con éxito!');
      console.log('Este es el hash que debes poner en tu comando SQL INSERT:');
      console.log(hash);
      console.log('----------------------------------------------------');

      // Ejemplo de cómo se vería en el SQL:
      console.log(`\nEjemplo SQL:\nINSERT INTO usuarios (..., password_hash, ...) VALUES (..., '${hash}', ...);`);
    });
