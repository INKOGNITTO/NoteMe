
import models.User;
import play.jobs.*;
import play.test.*;


@OnApplicationStart
public class Bootstrap extends Job {

    /**
     * vychodzie data do databazy
     */
    @Override
    public void doJob() {
        if(User.count() == 0) {
            Fixtures.loadModels("initial-data.yml");
        }
    }
    
}

