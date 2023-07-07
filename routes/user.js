var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    console.log(req.body);
    const recipe_id = req.body.recipeId;
    let success = await user_utils.markAsFavorite(user_id,recipe_id);
    if(success){
      res.status(200).send("The Recipe successfully saved as favorite");
    }
    else{
      res.status(400).send("The id is already in the system with this user");
    }
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array,user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.get('/last', async (req,res,next) => {
  try{
    console.log("hello");
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.get3LastViewd(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element[0].recipe_id)); //extracting the recipe ids into array
    console.log(recipes_id_array);
    let res1 = [];
    for(let i =0; i<3;i++){
      if(recipes_id_array[i]==0){
        continue
      }
      res1.push(await recipe_utils.getRecipesPreview(recipes_id_array[i],user_id));
    }
    res.status(200).send(res1);
  } catch(error){
    next(error); 
  }
});

router.get('/own', async (req,res,next) => {//TODO make it work
  try{
    const user_id = req.session.user_id;
    if(user_id != undefined && user_id != null){
    let own_recipes = {};
    const titles = await user_utils.getOwnRecipes(user_id);
    console.log(titles);
    let recipes_id_array = [];
    titles.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    console.log(recipes_id_array);
    const results = await recipe_utils.getRecipesPreviewOwn(recipes_id_array);
    res.status(200).send(results);
    }
  } catch(error){
    next(error); 
  }
});
router.get('/family', async (req,res,next) => {//TODO make it work
  try{
    const user_id = req.session.user_id;
    if(user_id != undefined && user_id != null){
    const ids = await user_utils.getfamilyRecipes(user_id);
    console.log(ids);
    let recipes_id_array = [];
    ids.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    console.log(recipes_id_array);
    const results = await recipe_utils.getRecipesPreviewFamily(recipes_id_array);
    if(results.length !=0){
      res.status(200).send(results);
    }
    else{
      res.status(400).send("There's no family recipes to this user");
    }
    }
  } catch(error){
    next(error); 
  }
});
router.post("/createRecipe", async (req, res, next) => {//TODO Make it create recipe
  try {
    const user_id = req.session.user_id;//session is currently an empty object.
    if(user_id != undefined && user_id != null){
    let id = await DButils.execQuery("SELECT max(recipe_id) from recipes");
    try{
      id = id[0]['max(recipe_id)'] + 1;
    }
    catch(err){
      id = 1;
    }
    if (typeof id != 'number' || !Number.isInteger(id) || id <= 0) {
      id = 1
    }
    let recipe_ditails = {
      title: req.body.title,
      image: req.body.image,
      readyInMinutes: req.body.readyInMinutes,
      vegetarian: req.body.vegetarian,
      vegan: req.body.vegan,
      glutenFree: req.body.glutenFree,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      servings: req.body.servings,
      description: req.body.description
    }
    let recipes = [];
    recipes = await DButils.execQuery("SELECT title from recipes");

    if (recipes.find((x) => x.title === recipe_ditails.title))
      throw { status: 409, message: "recipe title is already in" };

    // add the new recipe
    await DButils.execQuery(
      `INSERT INTO recipes VALUES ('${id}','${user_id}','${recipe_ditails.title}', '${recipe_ditails.image}', '${recipe_ditails.readyInMinutes}',
      '0',${recipe_ditails.vegetarian}, ${recipe_ditails.vegan}, ${recipe_ditails.glutenFree},False,False, '${JSON.stringify(recipe_ditails.ingredients)}',
      '${recipe_ditails.instructions}', '${recipe_ditails.servings}', '${recipe_ditails.description}')`
    );
    res.status(201).send({ message: "recipe created", success: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
