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
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}
async function checkViewd(recipe_id,user_id){
    let viewed = await DButils.execQuery(`SELECT * FROM viewedrecipes where user_id=${user_id} and recipe_id=${recipe_id}`);
    if(viewed.length == 0){
        return False;
    }
    else{
        return True;
    }
}

async function checkFavorite(recipe_id,user_id){
    let viewed = await DButils.execQuery(`SELECT * FROM favoriterecipes where user_id=${user_id} and recipe_id=${recipe_id}`);
    if(viewed.length == 0){
        return False;
    }
    else{
        return True;
    }
}

async function getRecipesPreview(recipe_id,user_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
    let viewed = checkViewd(recipe_id,user_id);
    let favorite = checkFavorite(recipe_id,user_id);
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

async function getRecipeArrayRand(n) {
    let set = new Set();
    console.log(n)
    while (set.size < n) {
        set = set.add(Math.floor(Math.random() * (100000)) + 1);
    }
    let result = Array.from(set);
    for (let i = 0; i < result.length; i++) {
        try{
            result[i] = await getRecipeDetails(result[i]);
        }
        catch{
            result[i] = Math.floor(Math.random() * (100000)) + 1;
            i--;
        }
      }
    return Promise.all(result);
}

async function getSearchResults(params_data){
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
        results[i] = {
            id:curr.id, 
            title:curr.title, 
            readyInMinutes:curr.readyInMinutes, 
            image:curr.image, 
            aggregateLikes:curr.aggregateLikes, 
            vegan:curr.vegan, 
            vegetarian:curr.vegetarian, 
            glutenFree:curr.glutenFree 
        };
      }
    return results;

}


exports.getSearchResults = getSearchResults;
exports.getRecipeDetails = getRecipeDetails;
exports.getRecipeArrayRand = getRecipeArrayRand;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipesPreviewOwn = getRecipesPreviewOwn;
exports.markAsviewed = markAsviewed;
