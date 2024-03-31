[2024-practice-test]

Refactors the practice test to be incorporated with the test, removing any need for practice test mode.
Practice mode:
    - Presents up to 20 screens to acquit the user with how the CogSpeed test works.
    - These rounds are un-judged, and do not contribute to the remainder of the test.
    - Roughly 4 correct answers in a row with an art less than ``right_count_art_less_than`` will continue on to self-paced mode. This is the only path to continue to self-paced mode.
    - If more than 20 screens pass without the above-mentioned condition, the test will exit unsuccessfully with error code 4.