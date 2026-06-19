export const validate = (schema, location = "body") => {
  return (req, res, next) => {
    const source = (() => {
      if (location === "params") return req.params;
      if (location === "query") return req.query;
      return req.body;
    })();

    const result = schema.safeParse(source);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.flatten().fieldErrors,
      });
    }

    req.validatedData = result.data;
    next();
  };
};
