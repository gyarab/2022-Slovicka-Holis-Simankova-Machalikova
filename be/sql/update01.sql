ALTER TABLE word_state DROP COLUMN word;
ALTER TABLE word_state ADD COLUMN word_group INTEGER REFERENCES word_groups ON DELETE CASCADE;
ALTER TABLE word_state ADD CONSTRAINT word_group_user_unique UNIQUE(word_group, "user");

create function updatenodecompletioncount() returns trigger
    language plpgsql
as
$$
DECLARE
    node INTEGER;
    words_in_node INTEGER;
    words_known INTEGER;
    number_of_completion_count INTEGER;
BEGIN
    SELECT course_node INTO node FROM word_groups WHERE word_groups.id = NEW.word_group;

    SELECT
        COUNT(*) AS total,
        (SELECT COUNT(*)
         FROM word_groups
                  INNER JOIN word_state AS ws on word_groups.id = ws.word_group
         WHERE word_groups.course_node = node AND state = 'known'
        ) AS known INTO words_in_node, words_known
    FROM word_groups
    WHERE word_groups.course_node = node;

    IF words_in_node = words_known THEN
        SELECT cns.number_of_completion INTO number_of_completion_count FROM course_node_state AS cns
        WHERE "user" = NEW."user" AND course_nodes = node;

        IF number_of_completion_count IS NULL THEN
            INSERT INTO course_node_state ("user", "course_nodes", "number_of_completion") VALUES (NEW."user", node, 1);
        ELSE
            UPDATE course_node_state AS cns SET number_of_completion = number_of_completion_count + 1
            WHERE "user" = NEW."user" AND course_nodes = node;
        END IF;

        DELETE FROM word_state
            USING word_groups, course_nodes
        WHERE word_state.word_group = word_groups.id AND
                word_groups.course_node = course_nodes.id AND
                course_nodes.id = node;

        return NULL;
    END IF;

    return NEW;
END
$$;

CREATE TRIGGER node_completion_count
    AFTER INSERT OR UPDATE ON word_state
    FOR EACH ROW EXECUTE FUNCTION updateNodeCompletionCount();