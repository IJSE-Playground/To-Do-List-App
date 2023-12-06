package lk.ijse.dep11.todo.api;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lk.ijse.dep11.todo.to.TaskTo;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.annotation.PreDestroy;
import java.sql.*;
import java.util.LinkedList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@CrossOrigin
public class TaskHttpController {

    // Database connection pool using HikariCP
    private final HikariDataSource pool;

    // Constructor to initialize the HikariCP pool with database configuration
    public TaskHttpController() {
        HikariConfig config = new HikariConfig();
        config.setUsername("postgres");
        config.setPassword("199757");
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/database1");
        config.setDriverClassName("org.postgresql.Driver");
        config.addDataSourceProperty("maximumPoolSize", 10);
        pool = new HikariDataSource(config);
    }

    // Close the database connection pool when the bean is destroyed
    @PreDestroy
    public void destroy() {
        pool.close();
    }

    // Create a new task endpoint
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(produces = "application/json", consumes = "application/json")
    public TaskTo createTask(@RequestBody @Validated TaskTo task) {
        try (Connection connection = pool.getConnection()) {
            // Insert a new task into the database and retrieve the generated ID
            PreparedStatement stm = connection.prepareStatement("INSERT INTO task (description, status, email) VALUES (?, FALSE, ?)", Statement.RETURN_GENERATED_KEYS);
            stm.setString(1, task.getDescription());
            stm.setString(2, task.getEmail());
            stm.executeUpdate();
            ResultSet generatedKeys = stm.getGeneratedKeys();
            generatedKeys.next();
            int id = generatedKeys.getInt(1);
            task.setId(id);
            task.setStatus(false);
            return task;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    // Update an existing task endpoint
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping(value = "/{id}", consumes = "application/json")
    public void updateTask(@PathVariable int id,
                           @RequestBody @Validated(TaskTo.Update.class) TaskTo task) {
        try (Connection connection = pool.getConnection()) {
            // Check if the task with the given ID exists
            PreparedStatement stmExist = connection.prepareStatement("SELECT * FROM task WHERE id = ?");
            stmExist.setInt(1, id);
            if (!stmExist.executeQuery().next()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task Not Found");
            }

            // Update the task in the database
            PreparedStatement stm = connection.prepareStatement("UPDATE task SET description = ?, status=? WHERE id=?");
            stm.setString(1, task.getDescription());
            stm.setBoolean(2, task.getStatus());
            stm.setInt(3, id);
            stm.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    // Delete a task endpoint
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable("id") int taskId) {
        try (Connection connection = pool.getConnection()) {
            // Check if the task with the given ID exists
            PreparedStatement stmExist = connection.prepareStatement("SELECT * FROM task WHERE id = ?");
            stmExist.setInt(1, taskId);
            if (!stmExist.executeQuery().next()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task Not Found");
            }

            // Delete the task from the database
            PreparedStatement stm = connection.prepareStatement("DELETE FROM task WHERE id=?");
            stm.setInt(1, taskId);
            stm.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    // Get all tasks for a specific email endpoint
    @GetMapping(produces = "application/json", params = {"email"})
    public List<TaskTo> getAllTasks(String email) {
        try (Connection connection = pool.getConnection()) {
            // Retrieve all tasks for a specific email from the database
            PreparedStatement stm = connection.prepareStatement("SELECT * FROM task WHERE email =? ORDER BY id");
            stm.setString(1, email);
            ResultSet rst = stm.executeQuery();
            List<TaskTo> taskList = new LinkedList<>();
            while (rst.next()) {
                int id = rst.getInt("id");
                String description = rst.getString("description");
                boolean status = rst.getBoolean("status");
                taskList.add(new TaskTo(id, description, status, email));
            }
            return taskList;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
