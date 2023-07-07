const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    try{
        await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
        return true
    }
    catch(err){
        return false
    }
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function get3LastViewd(user_id){
    const recipes_id1 = await DButils.execQuery(`select last1 as recipe_id from users where user_id='${user_id}'`);
    const recipes_id2 = await DButils.execQuery(`select last2 as recipe_id from users where user_id='${user_id}'`);
    const recipes_id3 = await DButils.execQuery(`select last3 as recipe_id from users where user_id='${user_id}'`);
    recipe_id = [recipes_id1,recipes_id2,recipes_id3]
    for(let i in recipe_id){
        if(i.recipe_id == 0){
            recipe_id.splice(recipe_id.indexOf(i),1);
        }
    }
    console.log(recipe_id);
    return recipe_id;
}
async function getOwnRecipes(user_id){
    const ids = await DButils.execQuery(`select recipe_id from recipes where user_id='${user_id}'`);
    return ids;
}

async function getfamilyRecipes(user_id){
    const ids = await DButils.execQuery(`select recipe_id from familyrecipes where user_id='${user_id}'`);
    return ids;
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.get3LastViewd = get3LastViewd;
exports.getOwnRecipes = getOwnRecipes;
exports.getfamilyRecipes = getfamilyRecipes;
