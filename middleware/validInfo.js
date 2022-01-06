module.exports = (req, res, next) => {
  const { legajo, nombre, apellido, password, turno, telefono } = req.body;

  const validLegajo = (legajo) => {
    return /^[0-9]{5}$/.test(legajo);
  };

  function checkPasswordValidation(value) {
    const isWhitespace = /^(?=.*\s)/;
    if (isWhitespace.test(value)) {
      return "No puede haber espacios en la contraseña";
    }

    const isContainsUppercase = /^(?=.*[A-Z])/;
    if (!isContainsUppercase.test(value)) {
      return "La contraseña debe tener al menos UNA letra mayuscula";
    }

    const isContainsLowercase = /^(?=.*[a-z])/;
    if (!isContainsLowercase.test(value)) {
      return "La contraseña debe tener al menos UNA letra minuscula";
    }

    const isContainsNumber = /^(?=.*[0-9])/;
    if (!isContainsNumber.test(value)) {
      return "La contraseña debe tener al menos UN numero";
    }

    const isValidLength = /^.{8,16}$/;
    if (!isValidLength.test(value)) {
      return "La contraseña debe tener entre 8 y 16 caracteres";
    }
    return null;
  }

  if (req.path === "/register") {
    if (![legajo, nombre, apellido, password, turno, telefono].every(Boolean)) {
      return res.status(400).json("Faltan completar campos");
    } else if (!validLegajo(legajo)) {
      return res.status(401).json("Legajo invalido");
    } else if (checkPasswordValidation(password)) {
      return res.status(401).json(checkPasswordValidation(password));
    }
  } else if (req.path === "/login") {
    if (![legajo, password].every(Boolean)) {
      return res.status(400).json("Faltan completar campos");
    } else if (!validLegajo(legajo)) {
      return res.status(401).json("Legajo invalido");
    }
  }

  next();
};
