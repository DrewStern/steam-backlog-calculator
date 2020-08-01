import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';
import * as fs from 'fs';

let NEWLINE = "\r\n";

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
    return fs.readFileSync('game_library.txt', 'utf8').split(NEWLINE);
}

function write_results(games: Array<HowLongToBeatEntry>) {
    write_library_details(games);

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
    let message = "Total Playtime (@ '" + gameplayTier + "' tier): " + total_playtime + NEWLINE;
    // console.log(message);
    fs.appendFile('library_summary.txt', message, ()=>{});
}

function write_shortest_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    games.sort((a, b) => a[gameplayTier] - b[gameplayTier]);
    let message = "Shortest game (@ '" + gameplayTier + "' tier): " + games[0].name + NEWLINE;
    // console.log(message);
    fs.appendFile('library_summary.txt', message, ()=>{});
}

function write_longest_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    games.sort((a, b) => b[gameplayTier] - a[gameplayTier]);
    let message = "Longest game (@ '" + gameplayTier + "' tier): " + games[0].name + NEWLINE;
    // console.log(message);
    fs.appendFile('library_summary.txt', message, ()=>{});
}