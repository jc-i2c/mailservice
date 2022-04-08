# mailservice

## Mail and password configuration.

First, you have to mention your mail address and password in a config file.
You can add a config file in multiple mail configurations. And you have to provide the correct mail address or password otherwise error can be raised.

## Download file path related configuration.

If you want to store an attachment file in a specific folder then you have to define the proper folder path with key is [donwloadPath]. Otherwise, config file in compulsory you have to define default path with key is [defaultPath] otherwise file download in occurred error.

Example - "donwloadPath": "D:/projectwork/mailservice/emailattachment/files"

## allowed emails configuration.

If you want to specific mail-based read the mail then you can mention it in the config file and the defined key is [allowedEmails]. either you can keep it up empty for all mail addresses allowed.

Example -
"allowedEmails": [
"mailaddress@outlook.com",
"mailaddress@gmail.com",
"mailaddress@gmail.com"
"mailaddress@outlook.com",
],

## Mail subject line configuration.

If you want to read mail based on a specific subject line then you can mentation subject line and the key is [subjectName] then you can define either single subject line, multiple subject lines and either define empty[] array for any subject line.

Example - "subjectName": ["subject1","subject2","subject3"],

## Mail attachment file extension configuration.

If you want to download extension based on file then you have to define the [extensions] key word. And you can define either single extension, multiple extensions and either define empty[] array for any extension.

Example - "extensions": [".png",".jpg",".pdf"],

## API URL.

http://{servername:portnumber}/mailservice/read

## Required library

base64-stream,
buffer,
cls-rtracer,
fs,
imap,
moment,
path,
split,
util,
winston,
winston-daily-rotate-file
