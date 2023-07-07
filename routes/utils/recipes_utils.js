const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 * 
 */
async function markAsviewed(user_id, recipe_id){
    await DButils.execQuery(`insert into viewedrecipes values ('${user_id}',${recipe_id})`);
}

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    console.log(recipe_info);
    let {analyzedInstructions, id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,servings,extendedIngredients,instructions } = recipe_info.data;

    return {
        analyzedInstructions:analyzedInstructions,
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        servings: servings,
        extendedIngredients: extendedIngredients,
        instructions: instructions,
    }
}
async function checkViewd(recipe_id,user_id){
    let viewed = await DButils.execQuery(`SELECT * FROM viewedrecipes where user_id=${user_id} and recipe_id=${recipe_id}`);
    if(viewed.length == 0){
        return false;
    }
    else{
        return true;
    }
}

async function checkFavorite(recipe_id,user_id){
    let viewed = await DButils.execQuery(`SELECT * FROM favoriterecipes where user_id=${user_id} and recipe_id=${recipe_id}`);
    if(viewed.length == 0){
        return false;
    }
    else{
        return true;
    }
}

async function getRecipesPreview(recipe_id,user_id=undefined) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
    var viewed;
    var favorite;
    if(user_id != undefined){
        viewed = await checkViewd(recipe_id,user_id);
        favorite = await checkFavorite(recipe_id,user_id);
    }
    else{
        viewed = false;
        favorite = false;
    }
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        viewed: viewed,
        favorite: favorite
    }
}

async function getRecipesPreviewHelp(details,user_id=undefined) {
    var viewed;
    var favorite;
    if(user_id != undefined){
        viewed = await checkViewd(details.id,user_id);
        favorite = await checkFavorite(details.id,user_id);
    }
    else{
        viewed = false;
        favorite = false;
    }
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = details;
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        viewed: viewed,
        favorite: favorite
    }
}


async function getRecipesPreviewOwn(recipe_ids) {
    var res = []
    for (let i = 0; i < recipe_ids.length; i++) {
        let recipe = await DButils.execQuery(`SELECT recipe_id,image,title,readyInMinutes,popularity,vegetarian,vegan,glutenFree,isClicked,favorite from recipes WHERE recipe_id='${recipe_ids[i]}'`);
        res.push(recipe)
      }
    console.log(res);
    return res;
}


async function getRecipesPreviewFamily(recipe_ids) {
    var res = []
    for (let i = 0; i < recipe_ids.length; i++) {
        let recipe = await DButils.execQuery(`SELECT user_id,image,title,origin,occasion,ingredients,instructions,readyInMinutes from familyrecipes WHERE recipe_id='${recipe_ids[i]}'`);
        res.push(recipe)
      }
    console.log(res);
    return res;
}


async function getRecipeArrayRand(n,user_id) {
    var results = await axios.get(`${api_domain}/random`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey,
            number: n
        }
    });
    results = results.data["recipes"]
    for (let i = 0; i < results.length; i++) {
        let curr = results[i];
        results[i] = await getRecipesPreviewHelp(
            {
                id:curr.id, 
                title:curr.title, 
                readyInMinutes:curr.readyInMinutes, 
                image:curr.image, 
                aggregateLikes:curr.aggregateLikes, 
                vegan:curr.vegan, 
                vegetarian:curr.vegetarian, 
                glutenFree:curr.glutenFree 
            },
            user_id
        )   

      }
    return results;
}
    

async function getSearchResults(params_data,user_id){
    params_data.cuisines = params_data.cuisines.join(",");
    params_data.diets = params_data.diets.join(",");
    params_data.intolerances = params_data.intolerances.join(",");
    // let headers = "?query="+params_data.query+"&number="+params_data.number;
    // let c = params_data.cuisines !== "" ? "&cuisines="+params_data.cuisines : ""
    // let d = params_data.diets !== "" ? "&diets="+params_data.diets : ""
    // let i = params_data.intolerances !== "" ? "&intolerances="+params_data.intolerances : ""
    // headers = headers + c + d + i + "&apiKey=" + process.env.spooncular_apiKey
    let response = await axios.get(`${api_domain}/complexSearch`,
        {   
            params:
            {
                query:String(params_data.query), 
                number:Number(params_data.number), 
                cuisine:params_data.cuisines, 
                diet:params_data.diets,
                intolerances:params_data.intolerances, 
                apiKey:process.env.spooncular_apiKey,
                addRecipeInformation: true
            }
        }
    );
    results = response.data["results"]
    for (let i = 0; i < results.length; i++) {
        let curr = results[i];
        results[i] = await getRecipesPreviewHelp(curr,user_id);
        // {
        //     id:curr.id, 
        //     title:curr.title, 
        //     readyInMinutes:curr.readyInMinutes, 
        //     image:curr.image, 
        //     aggregateLikes:curr.aggregateLikes, 
        //     vegan:curr.vegan, 
        //     vegetarian:curr.vegetarian, 
        //     glutenFree:curr.glutenFree 
        // };
      }
    return results;

}


exports.getSearchResults = getSearchResults;
exports.getRecipeDetails = getRecipeDetails;
exports.getRecipeArrayRand = getRecipeArrayRand;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipesPreviewOwn = getRecipesPreviewOwn;
exports.markAsviewed = markAsviewed;
exports.getRecipesPreviewFamily = getRecipesPreviewFamily;
exports.checkViewd = checkViewd;
exports.checkFavorite = checkFavorite;


