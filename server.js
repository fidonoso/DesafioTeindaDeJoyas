const express = require("express");
const joyas = require("./db/joyas.js");
const app = express();
app.listen(3000, () => {
  console.log(`Servidor escuchando en el puerto 3000`);
});

//1.-Crear una ruta para la devolución de todas las joyas aplicando HATEOAS.
const HATEOAS = () => {
  return joyas.results;
};

//2. Hacer una segunda versión de la API que ofrezca los mismos datos pero con los nombres de las propiedades diferentes.
const HATEOAS2 = () => {
  return joyas.results.map((e) => {
    return {
      id: e.id,
      nombre: e.name,
      modelo: e.model,
      categoria: e.category,
      metal: e.metal,
      cadena: e.cadena,
      medida: e.medida,
      valor: e.value,
      stock: e.stock,
    };
  });
};

//1.-Crear una ruta para la devolución de todas las joyas aplicando HATEOAS.
app.get("/v1/joyas", (req, res) => {
  res.send({
    JOYAS: HATEOAS(),
  });
});

//2. Hacer una segunda versión de la API que ofrezca los mismos datos pero con los nombres de las propiedades diferentes.
app.get("/v2/joyas", (req, res) => {
  res.send({
    JOYAS: HATEOAS2(),
  });
});

// 3. La API REST debe poder ofrecer una ruta con la que se puedan filtrar las joyas porcategoría.
const filtrarCategoria = (category) => {
  return joyas.results.filter((x) => x.category == category);
};
app.get("/v1/joyas/category/:category", (req, res) => {
  const { category } = req.params;
  res.send({
    cantidad: filtrarCategoria(category).length,
    joyas: filtrarCategoria(category),
  });
});

// 4. Crear una ruta que permita el filtrado por campos de una joya a consultar.
//5. Crear una ruta que devuelva como payload un JSON con un mensaje de error cuando el usuario consulte el id de una joya que no exista.
const selecCampos = (joyas, campos) => {
  for (let prop in joyas) {
    if (!campos.includes(prop)) delete joyas[prop];
  }
  return joyas;
};
app.get("/v2/joyas/joya/:id", (req, res) => {
  const { id } = req.params;
  const { campos } = req.query;
  let joya = joyas.results.find((x) => x.id == id);
  //si existe la query ?campos hará lo siguiente
  if (campos) {
    let joyita = selecCampos(joya, campos.split(","));
    return res.send({
      joya: joyita,
    });
  }
  //De no existir la query ?campos, revisará si existe la joya con el id solicitados, sino existe, devolverá un json con el error
  joya
    ? res.send({ joya: joyas.results.find((x) => x.id == id) })
    : res.status(404).send({
        error: "404 Not Found",
        message: `No existe ninguna joya con ese id: ${id}`,
      });
});

//6. Permitir hacer paginación de las joyas usando Query Strings.
//7. Permitir hacer ordenamiento de las joyas según su valor de forma ascendente o descendente usando Query Strings.

orderValues = (order) => {
  return order == "asc"
    ? joyas.results.sort((a, b) => (a.value > b.value ? 1 : -1))
    : order == "desc"
    ? joyas.results.sort((a, b) => (a.value < b.value ? 1 : -1))
    : false;
};

app.get("/api/v2/joyas", (req, res) => {
  //ORDEN: si existe en la query el parametro 'values'
  const { values } = req.query;
  if (values == "asc") return res.send(orderValues("asc"));
  if (values == "desc") return res.send(orderValues("desc"));
  //PAGINACION: si no existe 'values' en la query, buscará 'page' en la query
  if (req.query.page) {
    const { page } = req.query;
    return res.send({ Joyas: HATEOAS2().slice(page * 3 - 3, page * 3) });
  }
  //Si no exite ni 'values' ni 'page' en la query, devolverá todas las joyas que entrega HATEOAS2
  res.send({
    Joyas: HATEOAS2(),
  });
});
