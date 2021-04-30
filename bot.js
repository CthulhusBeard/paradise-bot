let devMode = false;

// ~~~~~~~~~~~~~~~~~~~~ Global Variables ~~~~~~~~~~~~~~~~~~~~~ //
const Discord = require('discord.js');
const auth = require('./auth.json');
const skillList = require('./skills.json');

const CHANNELS = {
    beep_boop: '828290530583511110', 
    skill_specialization: '806612432410902549',
    drinking_game: '822584032465780767',
};

const ROLES = {
    survivor: '804810087414628383',
}

const USERS = {
    Bot: '828289280753401857',
    Sesh: '616754792965865495',
    Derek: '555052718763409412',
};
const COMMANDS = {
    role: '!role',
    skills: '!skills',
    thanksbabe: '!thanksbabe',
    rizzoscream: '!rizzoscream',
    youdied: '!youdied',
    killedyourself: '!killedyourself',
    levelup: '!levelup',
    horde: '!horde',
    landmine: '!landmine',
    drink: '!drink',
    help: '!help',
};

// ~~~~~~~~~~~~~~~~~~~~ Setup ~~~~~~~~~~~~~~~~~~~~~ //

// Initialize Discord Bot
const bot = new Discord.Client();

try {
    //console.log('try auth');
    bot.login(auth.token)
        .then()
        .catch(console.error);
} catch (e) {
    console.log('e:'+e);
    log(e);
}
bot.once('ready', () => {
    let str = '///////////// BOT READY //////////////';
    if(devMode) {
        str = '///////////// TEST BOT READY //////////////'
    }
    console.log(str);
    //checkListTimeout();
});

/*
function checkListTimeout() {
    setTimeout(() => {
        //do things
    }, 150000); 
    
}*/

//
function sendToChannel(channelId, content) {
    if(devMode) {
        channelId = CHANNELS.testing;
    }

    let channel = bot.channels.cache.get(channelId);
    if(channel) {
        channel.send(content);
    } else {
        bot.channels.fetch(channelId).then(fetchedChannel => {
            fetchedChannel.send(content);
        }).catch(console.error);
    }

}

async function getChannel(channelId) {
    let channel = bot.channels.cache.get(channelId);
    if(!channel) {
        channel = await bot.channels.fetch(channelId).catch(console.error);
    }
    return channel;
}

function findCommand(message, command) {
    return (message.substr(0, command.length).trim().toLowerCase() === command);
}


function createRoleList(members, onlineOnly) {
    let roleList = [];

    //console.log(typeof members);
    //console.log(members);

    members.each(function(user) {
        //console.log(user.displayName);
        if(user.id === USERS.Bot || user.id === USERS.Sesh) {
            return;
        }
        if(onlineOnly && user.presence.status === 'offline' ) {
            return;
        }

        let roles;
        if(user.hasOwnProperty('_roles')) {
            roles = user._roles;
        } else if(user.hasOwnProperty('roles')) {
            roles = user.roles;
            if(user.roles.hasOwnProperty('cache')) {
                roles = user.roles.cache;
            }
        } else {
            console.log('none');
            console.log(user);
            return;
        }

        //console.log(typeof roles);
        //console.log(roles);

        for(let j in roles) {
            //console.log(roles[j]);
            if(!roleList.hasOwnProperty(roles[j])) {
                roleList[roles[j]] = [];
            }
            roleList[roles[j]].push(user.displayName);
        }
    });

    return roleList;
}

function generateChecklist(channelId, members, onlineOnly = false, showInfo = false) {
    //console.log('start checklist');
    let msgText = '__**Recommended Skill Checklist**__\n\n';
    let roleList = createRoleList(members, onlineOnly);

    //console.log('roleList');
    //console.log(roleList);

    for(let stat in skillList) {
        msgText += '**'+stat+'**:\n'; //Main Stat

        //List Skills
        for(let i in skillList[stat]['skills']) {
            let skill = skillList[stat]['skills'][i];
            let users = [];

            //Get users with this role
            if(roleList.hasOwnProperty(skill.role)) {
                users = roleList[skill.role];
            }

            //Generate Text for Skill
            if((skill.hasOwnProperty('anyone') && skill.anyone) || (skill.hasOwnProperty('recommended') && skill.recommended > 0)) {
                //Skill Name
                msgText += '• '+skill.name+' ';
                if(showInfo) {
                    //msgText += ': '+skill.desc+' ';
                }

                if(skill.hasOwnProperty('anyone') && skill.anyone) {
                    msgText += '(any): '; 
                } else if(skill.hasOwnProperty('recommended') && skill.recommended > 0) {
                    msgText += '('+users.length+'/'+skill.recommended;
                    if(users.length >= skill.recommended) {
                        msgText += ' :white_check_mark:'; 
                    }
                    msgText += '): '; 
                }
            } else {
                continue;
            }

            //Add Users
            let addedUsers = 0;
            for(let j in users) {
                if(addedUsers !== 0) {
                    msgText += ', ';
                }
                msgText += '**'+users[j]+'**';
                addedUsers++;
            }
            //End Skill
            msgText += '\n';
        }
        //End Stat
        msgText += '\n';
    }

    sendToChannel(channelId, msgText);
}


//On message
bot.on('message', message => {

    if(message.author.id === USERS.Bot || message.author.id === USERS.Sesh) {
        return;
    }

    //Direct messages
    //if(message.channel.type === 'dm') {
        //sendToChannel(CHANNELS.moderator_mail,  '<@'+message.author.id+'>: '+message.content);
        //return;
    //}

    //CheckList
    if(
        message.channel.id === CHANNELS.skill_specialization || 
        message.channel.id === CHANNELS.beep_boop 
    ) {

        //Help
        if(findCommand(message.content, COMMANDS.help)) {
            message.delete();
            let commandList = '📖 **Command List:**\n ';
            commandList += '*!skills -online* - Display skill checklist. "-online" uses only online members.\n'; //"-info" adds skill descriptions. 
            sendToChannel(message.channel.id, commandList);
            return;
        }
        
        //Checklist
        if(findCommand(message.content, COMMANDS.skills)) {
            message.delete();
            generateChecklist(message.channel.id, message.guild.members.cache, (message.content.indexOf('-online') >= 0), (message.content.indexOf('-info') >= 0));
        }
    }

    //Drinking Games
    if(
        message.channel.id === CHANNELS.drinking_game || 
        message.channel.id === CHANNELS.beep_boop 
    ) {

        //Help
        if(findCommand(message.content, COMMANDS.help)) {
            message.delete();
            let commandList = '📖 **Drinking Game Command List:**\n ';
            commandList += '*!youdied {person}* - Someone died!\n';
            commandList += '*!killedyourself {person}* - Someone killed themself!\n';
            commandList += '*!thanksbabe* - Derek said "Thanks babe"\n';
            commandList += '*!levelup {person}* - Someone leveled up!\n';
            commandList += '*!horde* - Horde Night Ended!\n';
            commandList += '*!rizzoscream* - Try not to spam this command!\n';
            commandList += '*!landmine* - Kaboom!!\n';
            commandList += '*!drink {text}* - You needed a reason to drink!\n';
            sendToChannel(message.channel.id, commandList);
            return;
        }

        //Randomizer
        let rng = Math.floor(Math.random() * 10);

        //Drink
        if(findCommand(message.content, COMMANDS.drink)) {
            message.delete();
            let msgText = '🍺 '+message.content.substr(COMMANDS.drink.length+1);
            sendToChannel(message.channel.id, msgText);
            return;
        }

        //You Died
        if(findCommand(message.content, COMMANDS.youdied)) {
            message.delete();
            const msg = new Discord.MessageEmbed()
                .setColor('#ff0000');

            if(message.content.substr(COMMANDS.youdied.length+1).trim().length) {
                msg.setTitle('💀 You died!');
                msg.addField('Drink half your drink! 🍺', message.content.substr(COMMANDS.youdied.length+1));
            } else {
                msg.setTitle('💀 Someone died! Drink half your drink! 🍺');
            }

            if(rng === 10) {
                msg.setImage('https://media.tenor.com/images/bc062431a86c63037d0cd04acd246f05/tenor.gif');
            } else if(rng === 9) {
                msg.setImage('https://media.tenor.com/images/1799af1dfd5b0db520032a1809c84cbf/tenor.gif');
            } else if(rng === 8) {
                msg.setImage('https://i.pinimg.com/originals/96/1e/57/961e57db2a9f893bf79ce6041ee22614.gif');
            } else if(rng === 7) {
                msg.setImage('https://i.pinimg.com/originals/53/92/01/539201e4c21295f63544f32d39d71184.gif');
            } else if(rng === 6) {
                msg.setImage('https://media1.tenor.com/images/02dd25d2fed7605814810607b03dcb22/tenor.gif');
            }

            sendToChannel(message.channel.id, msg);
            return;
        }

        //You Killed Yourself
        if(findCommand(message.content, COMMANDS.killedyourself)) {
            message.delete();
            const msg = new Discord.MessageEmbed()
                .setColor('#ff0000');

            if(message.content.substr(COMMANDS.killedyourself.length+1).trim().length) {
                msg.setTitle('💀 Death by your own hand!');
                msg.addField('Finish your drink! 🍺', message.content.substr(COMMANDS.killedyourself.length+1));
            } else {
                msg.setTitle('💀 Death by your own hand! Finish your drink! 🍺');
            }

            if(rng === 10) {
                msg.setImage('https://media1.tenor.com/images/61ae345e267e9ce138708d8058996bf4/tenor.gif');
            } else if(rng === 9) {
                msg.setImage('https://media1.tenor.com/images/0868777cce7a739bedb82553d8d2a53d/tenor.gif');
            } else if(rng === 8) {
                msg.setImage('https://media1.tenor.com/images/e6a7c1949d87aa5c4288507ec251a1c6/tenor.gif');
            } else if(rng === 7) {
                msg.setImage('https://media.tenor.com/images/566c6f6bf8ce2f72f30c44ddbf6a469f/tenor.gif');
            }
            
            msg.setTitle(msgText);

            sendToChannel(message.channel.id, msgText);
            return;
        }

        //Landmine
        if(findCommand(message.content, COMMANDS.landmine)) {
            message.delete();
            const msg = new Discord.MessageEmbed()
                .setColor('#ff0000')
                .setTitle('💣 Landmine!')
                .addField('Everyone drinks! 🍺', '@here');

            if(rng === 10) {
                msg.setImage('https://media.giphy.com/media/g9582DNuQppxC/giphy.gif');
            } else if(rng === 9) {
                msg.setImage('https://media2.giphy.com/media/yNFg0qdiJTX1sCTjNc/giphy-downsized-medium.gif');
            } else if(rng === 8) {
                msg.setImage('https://media.tenor.com/images/2ebceabbb185c4cde36969299b7d4fe2/tenor.gif');
            } else if(rng === 7) {
                msg.setImage('https://media0.giphy.com/media/GsuSyoFBCcRHy/giphy.gif');
            }
            sendToChannel(message.channel.id, msg);
            return;
        }

        //Thanks Babe
        if(findCommand(message.content, COMMANDS.thanksbabe)) {
            message.delete();
            const msg = new Discord.MessageEmbed()
                .setColor('#00ff00')
                .setTitle('🍺 "Thanks Babe!"');

            if(rng === 10) {
                msg.setImage('https://i.imgur.com/iwjBJFx.gif');
            } else if(rng === 9) {
                msg.setImage('https://media.giphy.com/media/ovQh20qogBz0s/giphy.gif');
            } else if(rng === 8) {
                msg.setImage('https://media.giphy.com/media/xTiTnLGmR2nlMiHRvy/giphy.gif');
            }

            msg.addField('Take a drink! 🍺', '<@&'+ROLES.survivor+'>');
            sendToChannel(message.channel.id, msg);
            return;
        }

        //Level up
        if(findCommand(message.content, COMMANDS.levelup)) {
            message.delete();

            const msg = new Discord.MessageEmbed()
                .setColor('#0000ff'); //green

            if(message.content.substr(COMMANDS.levelup.length+1).trim().length) {
                msg.setTitle('💪 Level up!');
                msg.addField('Take a drink! 🍺', message.content.substr(COMMANDS.levelup.length+1));
            } else {
                msg.setTitle('💪 Level up! Take a Drink! 🍺');
            }

            if(rng === 10) {
                msg.setImage('https://media.tenor.com/images/979e81657604bec0f00fa3c180d75eca/tenor.gif');
            } else if(rng === 9) {
                msg.setImage('https://i.imgur.com/TV3LPX6.gif');
            } else if(rng === 8) {
                msg.setImage('https://media4.giphy.com/media/dAdOa3ItVE89pkAZfx/source.gif');
            } else if(rng === 7) {
                msg.setImage('https://media.tenor.com/images/4ab61cccc28dc774c4f718c3080f8ccb/tenor.gif');
            }
            sendToChannel(message.channel.id, msg);
            return;
        }

        //Horde Night
        if(findCommand(message.content, COMMANDS.horde)) {
            message.delete();
            const msg = new Discord.MessageEmbed()
                .setColor('#ffff00') //yellow
                .setTitle('☀️ Sunrise is here! Did you survive the night? <@&'+ROLES.survivor+'> Take a drink! 🍺');
            sendToChannel(message.channel.id, msg);
            return;
        }

        //Rizzo
        if(findCommand(message.content, COMMANDS.rizzoscream)) {
            message.delete();
            const msg = new Discord.MessageEmbed()
                .setColor('#FFA500') //orange
                .setTitle('😱 Rizzo got scared! Two drinks! 🍺🍺');

            if(rng === 10) {
                msg.setImage('https://i.gifer.com/8NLZ.gif');
            } else if(rng === 9) {
                msg.setImage('https://media0.giphy.com/media/11NybLJG6LsHx6/giphy.gif');
            } else if(rng === 8) {
                msg.setTitle('😱 Who invited the little girl to this server? Two drinks! 🍺🍺');
            } else if(rng === 7) {
                msg.setTitle('😱 Did Rizzo pee his pants? Two drinks! 🍺🍺');
            } else if(rng === 6) {
                msg.setImage('https://media.tenor.com/images/1092cff763ada06c9e3ae3414f64c69c/tenor.gif');
            }

            sendToChannel(message.channel.id, msg);
            return;
        }
    }

    //🧟

});

// We're using the 'raw' event, which will run every time someone does anything - with this, we can emit 'messageReactionAdd' events
// Reference: https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md
/*
bot.on('raw', async packet => {
    try {
        //do extra for reactions
        if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) {
            // filter
            return;
        }
        //console.log('---');

        //Emoji
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        //console.log('Emoji: '+packet.d.emoji.name);

        // Channel
        let channel = await getChannel(packet.d.channel_id);

        // Message
        let message = channel.messages.cache.get(packet.d.message_id);
        if(!message) {
            await channel.messages.fetch(packet.d.message_id).then(data => {
                message = data;
            }).catch(console.error);
        }

        // User
        let user = message.guild.members.cache.get(packet.d.user_id);
        if(!user) {
            await message.guild.members.fetch(packet.d.user_id).then(data => {
                user = data;
            }).catch(console.error);
        }

        //Role reactions
        if(user && channel.id === CHANNELS.select_roles) {
            //roleReactions(emoji, user, (packet.t === 'MESSAGE_REACTION_REMOVE'));
            return;
        }

        //Reaction
        let reaction = message.reactions.cache.get(packet.d.emoji.name);
        if(!reaction) {
            await message.reactions.fetch(packet.d.emoji.name).then(data => {
                reaction = data;
            }).catch(console.error);
        }

        
        // Check which type of event it is before emitting
        try {
            if (packet.t === 'MESSAGE_REACTION_ADD') {
                bot.emit('messageReactionAdd', reaction, user);
            }
            if (packet.t === 'MESSAGE_REACTION_REMOVE') {
                bot.emit('messageReactionRemove', reaction, user);
            }
        } catch (e) {
            log("Error in emitting messageReactionAdd/Remove events");
            log(e);
        }
        

    } catch (e) {
        log("Error in the bot operations following a 'raw' event");
        log(e);
    }
});
*/




/*

bot.on('messageReactionAdd', function(messageReaction, user) { // Event is only emitted on cached messages - see below!
    try {

    } catch (e) {
        log('Message Reaction Add Error!');
        log(e);
    }
});

bot.on('messageReactionRemove', function(messageReaction, user) { // Event is only emitted on cached messages - see below!
    try {

    } catch (e) {
        log('Message Reaction Remove Error!');
        log(e);
    }
});

bot.on('guildMemberAdd', member => {

    member.send("Welcome to Paradise!")
        .catch(function() {
                console.log("Couldn't send welcome message to "+member.displayName);
            }
        );
});
*/