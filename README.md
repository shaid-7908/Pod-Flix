### API INFO

- #### Video-service
  - ##### POST - prefix (```/video/api/v1 ```)
  -  ```/stream/:videoId ``` - returns a S3 signed url
  -  ```/update-interaction``` - upadtes like , dislike
  - ```/add-comment``` - adds comment to a video
  - ```/reply-comment``` - reply to a comment 
  
  - ##### DELETE - prefix (```/video/api/v1 ```)
  - ```/delete-comment``` - delete comment
  - ##### GET - prefix (```/video/api/v1 ```)
  - ```/getall-likes``` - get total like count of a video
  - ```/get-comments``` - get all comments with reply count for a specific video