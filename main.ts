import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';
import * as fs from 'fs';
import { write } from 'fs/promises';
import { match } from 'assert';
import { isArray, isNumber } from 'util';
import { stringify } from 'querystring';

// let hltb_service = new HowLongToBeatService();
// let games: HowLongToBeatEntry[] = [];
// for (let game_name of get_game_names()) {
//     hltb_service.search(game_name).then(results => { 
//         let matched_games: HowLongToBeatEntry[] = results.filter(x => x.similarity === 1);

//         if (matched_games.length === 1) {
//             // let best_match: HowLongToBeatEntry = matched_games[0];
//             games.push(matched_games[0]);

//             write_results(games);
//         }
//     });
// }

find_all_games(get_game_names())
.then(games => write_results(games))
.catch(error => console.log(error));

function find_all_games(game_names: string[]): Promise<HowLongToBeatEntry[]> {
    let games: Array<HowLongToBeatEntry> = [];
    let promises: Array<Promise<HowLongToBeatEntry>> = [];
    for (let game_name of game_names) {
        promises.push(find_game(game_name)
            .then(matches => {
                if (matches.length > 0) {
                    let best_match: HowLongToBeatEntry = matches.filter(match => is_exact_match(match))[0];
                    if (!!best_match) {
                        // console.log(best_match);
                        games.push(best_match);
                    }
                }
                // console.log("games.length = " + games.length);
            })
            .catch(error => 
                console.log(error)
            )
        );
    }
    return Promise.all(promises).then(() => { return games; });
}

function find_game(game_name: string): Promise<HowLongToBeatEntry> {
    return (new HowLongToBeatService()).search(game_name);
}

function is_exact_match(game: HowLongToBeatEntry): boolean {
    return game.similarity === 1;
}

function get_game_names(): string[] {
    return fs.readFileSync('game_library.txt', 'utf8').split('\r\n');
}

function write_results(games: Array<HowLongToBeatEntry>) {
    // write_library_details(games);

    let gameplayTiers = ["gameplayMain", "gameplayMainExtra", "gameplayCompletionist"];
    for (let gameplayTier of gameplayTiers) {
        write_library_playtime(games, gameplayTier);
        write_shortest_playtime(games, gameplayTier);
        write_longest_playtime(games, gameplayTier);
    }
}

function write_library_details(games: Array<HowLongToBeatEntry>) {
    fs.appendFile('library_details.txt', JSON.stringify(games), ()=>{});
}

function write_library_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    let playtime_summer = (accumulator, current_game: HowLongToBeatEntry) => accumulator + current_game[gameplayTier];
    let total_playtime = games.reduce(playtime_summer, 0);
    console.log("Total Playtime (@ '" + gameplayTier + "' tier): " + total_playtime);
    // fs.appendFile('library_summary.txt', "Sum Main Playtime: " + sum_main_playtime, ()=>{});
}

function write_shortest_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    games.sort((a, b) => a[gameplayTier] - b[gameplayTier]);
    console.log("Shortest game (@ '" + gameplayTier + "' tier): " + games[0].name);
    // fs.appendFile('library_summary.txt', "Sum Main Playtime: " + sum_main_playtime, ()=>{});
}

function write_longest_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    games.sort((a, b) => b[gameplayTier] - a[gameplayTier]);
    console.log("Longest game (@ '" + gameplayTier + "' tier): " + games[0].name);
    // fs.appendFile('library_summary.txt', "Sum Main Playtime: " + sum_main_playtime, ()=>{});
}