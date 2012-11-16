package models;

import java.util.LinkedList;
import java.util.List;
import javax.persistence.*;
import play.data.validation.Required;
import play.db.jpa.Model;

@Entity
@Table (name = "tags")
public class Tag extends Model {

    @Required
    public String name;
	
    @ManyToOne
    @Required
    public User owner;
    
    @ManyToMany (mappedBy = "tags")
    @OrderColumn
    public List<Note> notes = new LinkedList<Note>();

}
