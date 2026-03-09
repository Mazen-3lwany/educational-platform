1- System Idea 
2- Actors 
3- Core Entities
4- Relations 
5- Actions 
6- EndPoints


1 - System Idea 
    Learing Paltform for Instructor Create Course and User can Enroll this course and Perform quizes  and join Online meeting


2- Actors 
  Student ---> User
  Instructor 
  Admin



3-Core Entity 
    Users
    Courses 
    Lessons
    Quizes 
    Comment
    Question
    Enrollment
    groups


4- Relations 
    Student ----enrolle--->course
    Instructor----create-->course
    course------has---->lesson
    Instructor -----create--->quiz
    Instructor----create---->group
    User------join----group
    User-----answer----quiz


5 - Actions 
    Student :
        register
        login
        enrolle course
        view courses
        submit quiz
        watch lesson

    Instructor : 
        register
        login
        create course
        delete course
        update course
        create quiz
        add lesson 

    Admin:
        manage users
        mange courses
    
    