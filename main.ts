import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';
import * as fs from 'fs';

let NEWLINE = "\r\n";
let GAME_LIBRARY_TXT = 'game_library.txt';
let LIBARY_DETAILS_CSV = "library_details.csv";
let LIBARY_SUMMARY_TXT = "library_summary.txt";

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
                    // console.log("matches = " + matches);
                    console.log(matches[0]);
                    let best_match: HowLongToBeatEntry = matches.sort(compare_by_similarity).filter(match => match.name.startsWith(game_name))[0];
                    // console.log("best_match = " + best_match);
                    if (!!best_match) {
                        games.push(best_match);
                    }
                }
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

function get_game_names(): string[] {
    return fs.readFileSync(GAME_LIBRARY_TXT, 'utf8').split(NEWLINE);
}

function write_results(games: Array<HowLongToBeatEntry>) {
    write_library_details(games);

    let gameplayTiers = ["gameplayMain"/*, "gameplayMainExtra", "gameplayCompletionist"*/];
    for (let gameplayTier of gameplayTiers) {
        write_library_playtime(games, gameplayTier);
        write_by_playtime(games, gameplayTier);
    }
}

function write_library_details(games: Array<HowLongToBeatEntry>) {
    let message = 
        "NAME,CASUAL_PLAYTIME,NORMAL_PLAYTIME,COMPLETE_PLAYTIME" + NEWLINE +
        games.sort(compare_by_name).map(x => map_game_data_to_csv_format(x)).join(NEWLINE);
    appendFile(LIBARY_DETAILS_CSV, message);
}

function write_by_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    let message = 
        "Shortest to Longest games (@ '" + gameplayTier + "' tier): " + NEWLINE + 
        games.sort(compare_by_playtime).map(x => x.name + " (" + x[gameplayTier] + ")" + NEWLINE);
    appendFile(LIBARY_SUMMARY_TXT, message);
}

function write_library_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    let playtime_accumulator = (accumulator, current_game: HowLongToBeatEntry) => accumulator + current_game[gameplayTier];
    let total_playtime = games.reduce(playtime_accumulator, 0);
    let message = "Total Playtime (@ '" + gameplayTier + "' tier): " + total_playtime + NEWLINE;
    appendFile(LIBARY_SUMMARY_TXT, message);
}

function appendFile(file_name: string, message: string) {
    fs.appendFile(file_name, message, () => {});
}

function map_game_data_to_csv_format(game: HowLongToBeatEntry): string {
    return game.name + "," + game.gameplayMain + "," + game.gameplayMainExtra + "," + game.gameplayCompletionist;
}

function compare_by_name(game1: HowLongToBeatEntry, game2: HowLongToBeatEntry): number {
    return game1.name == game2.name ? 0 : game1.name > game2.name ? 1 : -1;
}

function compare_by_similarity(game1: HowLongToBeatEntry, game2: HowLongToBeatEntry): number {
    return game2.similarity - game1.similarity;
}

function compare_by_playtime(game1: HowLongToBeatEntry, game2: HowLongToBeatEntry): number {
    return game1.gameplayMain - game2.gameplayMain;
}