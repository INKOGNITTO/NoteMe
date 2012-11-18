package models;

import java.util.LinkedList;
import java.util.List;
import javax.persistence.*;
import play.data.validation.Required;
import play.db.jpa.Model;

@Entity
@Table(name = "tags")
public class Tag extends Model {

    @Required
    public String name;
    
    @ManyToOne
    @Required
    public User owner;
    
    @ManyToMany(mappedBy = "tags")
    @OrderColumn
    public List<Note> notes = new LinkedList<Note>();

     public Tag(String name,User user){
        this.name = name;
        this.owner = user;
    }
    
    public static Tag create(String name, Long userID) {
        Tag tag = new Tag(name, User.<User>findById(userID));
        tag.save();
        return tag;
    }
    
    public String rename(String newName) {
        this.name = newName;
        this.save();
        return newName;
    }
}
